#include "evaluate-position.h"
#include "stockfish/src/attacks.h"
#include "stockfish/src/engine.h"
#include "stockfish/src/uci.h"

#include <mutex>
#include <sstream>
#include <stdexcept>

namespace reactnativestockfish {

std::string evaluate_position(const std::string& fen) {
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
    engine->search_clear();

    int depth = -1;
    std::string score;
    std::string bestMove;
    auto save = [&](const Stockfish::Engine::InfoShort& info) {
        depth = info.depth;
        score = Stockfish::UCIEngine::format_score(info.score);
    };
    engine->set_on_update_no_moves(save);
    engine->set_on_update_full([&](const auto& info) {
        if (info.bound.empty()) save(info);
    });
    engine->set_on_bestmove([&](auto move, auto) { bestMove = move; });

    Stockfish::Search::LimitsType limits;
    limits.depth = 12;
    limits.movetime = 100;
    limits.startTime = Stockfish::now();
    engine->go(limits);
    engine->wait_for_search_finished();
    if (depth < 0) throw std::runtime_error("Stockfish returned no completed evaluation");

    std::string type;
    int value;
    std::istringstream(score) >> type >> value;
    return "{\"scoreType\":\"" + type + "\",\"score\":" + std::to_string(value)
         + ",\"depth\":" + std::to_string(depth) + ",\"bestMove\":\"" + bestMove + "\"}";
}

}
