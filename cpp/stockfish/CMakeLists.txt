cmake_minimum_required(VERSION 3.22)

file(SHA256 "${CMAKE_CURRENT_SOURCE_DIR}/../nn-61e7af4bb97d.nnue" network_hash)
if(NOT network_hash STREQUAL "61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b")
  message(FATAL_ERROR "The bundled Stockfish lite network is missing or corrupt")
endif()

file(GLOB engine_sources CONFIGURE_DEPENDS "src/*.cpp" "src/nnue/*.cpp")
add_library(stockfish-lite-core STATIC
  ${engine_sources}
  src/nnue/features/p_hm.cpp
  fixes/stream_fix.cpp
  fixes/small_fixes.cpp
  ../react-native-stockfish.cpp
  ../evaluate-position.cpp
)
set_target_properties(stockfish-lite-core PROPERTIES POSITION_INDEPENDENT_CODE ON)
target_compile_features(stockfish-lite-core PUBLIC cxx_std_17)
target_compile_definitions(stockfish-lite-core PRIVATE USE_LITE_NET __NO_SYZYGY__)
target_include_directories(stockfish-lite-core PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/..")
target_compile_options(stockfish-lite-core PRIVATE -ffunction-sections -fdata-sections -fvisibility=hidden)

if(CMAKE_SIZEOF_VOID_P EQUAL 8)
  target_compile_definitions(stockfish-lite-core PRIVATE IS_64BIT USE_POPCNT)
endif()
if(CMAKE_SYSTEM_PROCESSOR MATCHES "^(aarch64|arm64)$")
  target_compile_definitions(stockfish-lite-core PRIVATE USE_NEON=8)
endif()
