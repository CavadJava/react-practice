#include <jni.h>
#include <stdio.h>

JNIEXPORT void JNICALL
Java_NativeDemo_hello(JNIEnv *env, jobject obj) {
    printf("Hello from C!\n");
}