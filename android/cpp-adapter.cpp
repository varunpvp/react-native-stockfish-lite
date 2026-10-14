#include <jni.h>
#include <string>
#include "react-native-stockfish.h"
#include "evaluate-position.h"

extern "C" JNIEXPORT jstring JNICALL
Java_com_loloof64_reactnativestockfish_ReactNativeStockfishModule_evaluateFen(JNIEnv *env, jobject, jstring fen)
{
    const char *input = env->GetStringUTFChars(fen, nullptr);
    if (!input) return nullptr;
    const std::string position(input);
    env->ReleaseStringUTFChars(fen, input);
    try {
        return env->NewStringUTF(reactnativestockfish::evaluate_position(position).c_str());
    } catch (const std::exception& error) {
        env->ThrowNew(env->FindClass("java/lang/IllegalArgumentException"), error.what());
        return nullptr;
    }
}

#define STR_SIZE 1024
char conv_buffer[STR_SIZE + 1];
char err_conv_buffer[STR_SIZE + 1];

extern "C" JNIEXPORT jdouble JNICALL
Java_com_loloof64_reactnativestockfish_ReactNativeStockfishModule_main(JNIEnv *env, jclass type)
{
    return reactnativestockfish::stockfish_main();
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_loloof64_reactnativestockfish_ReactNativeStockfishModule_stdinWrite(JNIEnv *env, jclass type, jstring command)
{
    ssize_t result;

    jboolean isCopy;
    const char *str = env->GetStringUTFChars(command, &isCopy);

    result = reactnativestockfish::stockfish_stdin_write(str);
    env->ReleaseStringUTFChars(command, str);

    if (result < 0)
    {
        return JNI_FALSE;
    }

    return JNI_TRUE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_loloof64_reactnativestockfish_ReactNativeStockfishModule_stdoutRead(JNIEnv *env, jclass type)
{
    char *output = reactnativestockfish::stockfish_stdout_read();
    // An error occured
    if (output == NULL)
    {
        return NULL;
    }

    std::strncpy(conv_buffer, output, STR_SIZE);

    return env->NewStringUTF(conv_buffer);
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_loloof64_reactnativestockfish_ReactNativeStockfishModule_stderrRead(JNIEnv *env, jclass type)
{
    char *output = reactnativestockfish::stockfish_stderr_read();
    // An error occured
    if (output == NULL)
    {
        return NULL;
    }

    std::strncpy(err_conv_buffer, output, STR_SIZE);

    return env->NewStringUTF(err_conv_buffer);
}
