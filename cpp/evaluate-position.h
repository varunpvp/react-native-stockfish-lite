#pragma once

#include <string>
#include <cstdint>
#include <vector>

namespace reactnativestockfish {
// A single-threaded, bounded search. Scores use the side-to-move perspective.
struct EvaluationOptions {
    int depth = 12;
    std::int64_t maxTimeMs = 100;
    std::uint64_t maxNodes = 0;
    int multiPv = 1;
    std::vector<std::string> searchMoves;
};

// Zero disables an individual search limit. At least one limit must be enabled.
std::string evaluate_position(const std::string& fen, const EvaluationOptions& options = {});
}
