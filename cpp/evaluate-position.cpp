#include "evaluate-position.h"
#include "stockfish/src/attacks.h"
#include "stockfish/src/engine.h"
#include "stockfish/src/movegen.h"
#include "stockfish/src/uci.h"

#include <algorithm>
#include <limits>
#include <mutex>
#include <set>
#include <sstream>
#include <stdexcept>

namespace reactnativestockfish {

namespace {
struct Line {
    int depth;
    std::string score;
    std::vector<std::string> moves;
};

struct Evaluation {
    int depth = -1;
    std::string score;
    std::string bestMove;
    std::vector<Line> lines;
    std::vector<Line> pending;
};

std::string score_json(const std::string& score) {
    std::string type;
    int value;
    if (!(std::istringstream(score) >> type >> value) || (type != "cp" && type != "mate"))
        throw std::runtime_error("Stockfish returned an invalid score");
    return "\"scoreType\":\"" + type + "\",\"score\":" + std::to_string(value);
}
}

std::string evaluate_position(const std::string& fen, const EvaluationOptions& options) {
    if (options.depth < 0 || options.depth >= Stockfish::MAX_PLY
        || options.maxTimeMs < 0 || options.maxTimeMs > std::numeric_limits<int>::max()
        || options.maxNodes > 9007199254740991ULL
        || options.multiPv < 1 || options.multiPv > Stockfish::MAX_MOVES
        || !(options.depth || options.maxTimeMs || options.maxNodes))
        throw std::invalid_argument("Invalid evaluation limits");

    // Share one engine and serialize calls from both native platforms.
    static std::mutex mutex;
    std::lock_guard<std::mutex> lock(mutex);
    static auto engine = [] {
        Stockfish::Attacks::init();
        Stockfish::Position::init();
        auto instance = std::make_unique<Stockfish::Engine>();
        instance->set_on_iter([](const auto&) {});
        instance->set_on_start([] {});
        instance->set_on_verify_network([](auto) {});
        return instance;
    }();

    if (auto error = engine->set_position(fen, {}))
        throw std::invalid_argument(error->what());

    // Validate the root filter: Stockfish otherwise silently falls back to all
    // legal moves when none of the supplied moves can be played.
    Stockfish::Position position;
    Stockfish::StateInfo state;
    if (auto error = position.set(fen, false, &state))
        throw std::invalid_argument(error->what());
    std::set<std::string> searchMoves(options.searchMoves.begin(), options.searchMoves.end());
    for (const auto& move : searchMoves)
        if (Stockfish::UCIEngine::to_move(position, move) == Stockfish::Move::none())
            throw std::invalid_argument("Illegal search move: " + move);
    const auto candidateCount = searchMoves.empty()
        ? Stockfish::MoveList<Stockfish::LEGAL>(position).size() : searchMoves.size();
    const auto lineCount = std::min(std::size_t(options.multiPv), candidateCount);

    engine->search_clear();
    std::istringstream multiPvOption("name MultiPV value " + std::to_string(options.multiPv));
    engine->get_options().setoption(multiPvOption);

    // Capture owned state: the shared engine retains callbacks between calls.
    auto result = std::make_shared<Evaluation>();
    engine->set_on_update_no_moves([result](const auto& info) {
        result->depth = info.depth;
        result->score = Stockfish::UCIEngine::format_score(info.score);
    });
    engine->set_on_update_full([result, lineCount](const auto& info) {
        if (info.multiPV == 1) result->pending.clear();
        if (!info.bound.empty() || info.multiPV != result->pending.size() + 1
            || (!result->pending.empty() && result->pending.front().depth != info.depth)) {
            result->pending.clear();
            return;
        }
        Line line{info.depth, Stockfish::UCIEngine::format_score(info.score), {}};
        std::istringstream pv{std::string(info.pv)};
        for (std::string move; pv >> move;) line.moves.push_back(move);
        if (line.moves.empty()) {
            result->pending.clear();
            return;
        }
        result->pending.push_back(std::move(line));
        // Publish only a complete, exact batch at a common depth. Interrupted
        // iterations can contain older PVs and must not replace this snapshot.
        if (result->pending.size() == lineCount && info.depth >= result->depth) {
            result->lines = result->pending;
            result->depth = info.depth;
            result->score = result->lines.front().score;
            result->bestMove = result->lines.front().moves.front();
        }
    });
    engine->set_on_bestmove([result](auto move, auto) {
        if (result->lines.empty()) result->bestMove = move;
    });

    Stockfish::Search::LimitsType limits;
    limits.depth = options.depth;
    limits.movetime = options.maxTimeMs;
    limits.nodes = options.maxNodes;
    limits.searchmoves.assign(searchMoves.begin(), searchMoves.end());
    limits.startTime = Stockfish::now();
    engine->go(limits);
    engine->wait_for_search_finished();
    if (result->depth < 0) throw std::runtime_error("Stockfish returned no completed evaluation");

    std::string json = "{" + score_json(result->score)
        + ",\"depth\":" + std::to_string(result->depth)
        + ",\"bestMove\":\"" + result->bestMove + "\",\"lines\":[";
    for (std::size_t i = 0; i < result->lines.size(); ++i) {
        const auto& line = result->lines[i];
        if (i) json += ",";
        json += "{\"rank\":" + std::to_string(i + 1) + "," + score_json(line.score)
            + ",\"depth\":" + std::to_string(line.depth) + ",\"moves\":[";
        for (std::size_t j = 0; j < line.moves.size(); ++j) {
            if (j) json += ",";
            json += "\"" + line.moves[j] + "\"";
        }
        json += "]}";
    }
    return json + "]}";
}

}
