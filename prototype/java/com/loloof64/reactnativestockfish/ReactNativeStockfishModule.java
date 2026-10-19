package com.loloof64.reactnativestockfish;

import java.io.BufferedReader;
import java.io.InputStreamReader;

// Tests the actual Android shared library through the wrapper's JNI entry points.
public class ReactNativeStockfishModule {
    private static native void main();
    private static native String stdoutRead();
    private static native String stderrRead();
    private static native void stdinWrite(String command);
    private static native String evaluateFen(String fen, double depth, double maxTimeMs,
                                           double maxNodes, double multiPv, String[] searchMoves);

    public static void main(String[] args) throws Exception {
        System.load("/data/local/tmp/libreact-native-stockfish-lite.so");
        if (args.length > 0 && args[0].equals("evaluate")) {
            BufferedReader input = new BufferedReader(new InputStreamReader(System.in));
            for (String fen; (fen = input.readLine()) != null;) {
                System.out.println(evaluateFen(fen, 12, 100, 0, 1, new String[0]));
            }
            return;
        }
        Thread engine = new Thread(() -> main());
        Thread output = new Thread(() -> {
            try {
                while (true) {
                    String line = stdoutRead();
                    if (line != null) {
                        System.out.println(line);
                        if (line.equals("quit")) return;
                    } else {
                        Thread.sleep(1);
                    }
                    String error = stderrRead();
                    if (error != null) System.err.println(error);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        engine.start();
        output.start();
        BufferedReader input = new BufferedReader(new InputStreamReader(System.in));
        for (String line; (line = input.readLine()) != null;) {
            stdinWrite(line);
            if (line.equals("quit")) break;
        }
        engine.join();
        output.join();
    }
}
