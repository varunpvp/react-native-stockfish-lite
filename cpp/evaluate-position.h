#pragma once

#include <string>

namespace reactnativestockfish {
// A single-threaded, bounded search. Scores use the side-to-move perspective.
std::string evaluate_position(const std::string& fen);
}
