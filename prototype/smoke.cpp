#include "react-native-stockfish.h"

#include <chrono>
#include <iostream>
#include <string>
#include <thread>

// Exercise the same native command/output interface used by React Native.
int main() {
    std::thread engine(reactnativestockfish::stockfish_main);
    std::thread output([] {
        while (true) {
            if (auto line = reactnativestockfish::stockfish_stdout_read()) {
                const std::string text(line);
                std::cout << text << std::endl;
                if (text == "quit") return;
            } else {
                std::this_thread::sleep_for(std::chrono::milliseconds(1));
            }
        }
    });
    for (std::string command; std::getline(std::cin, command);) {
        reactnativestockfish::stockfish_stdin_write(command.c_str());
        if (command == "quit") break;
    }
    engine.join();
    output.join();
}
