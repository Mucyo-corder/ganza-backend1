plugins {
    id("org.jetbrains.kotlin.jvm")
}

// The counting engine is a pure JVM module on purpose:
//  * it must be unit-testable on the desktop JVM with real OpenCV natives
//  * it must not depend on any Android API, so the counting logic is provably offline/local
//
// `org.openpnp:opencv` is the desktop build of the SAME OpenCV version (4.9.0) that the app
// ships for Android. It is `compileOnly` so the desktop natives never reach the device;
// on Android the classes are provided by `org.opencv:opencv:4.9.0` (the AAR).
dependencies {
    compileOnly("org.openpnp:opencv:4.9.0-0")

    testImplementation("org.openpnp:opencv:4.9.0-0")
    testImplementation("junit:junit:4.13.2")
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

tasks.withType<Test>().configureEach {
    // Headless AWT is used to synthesise deterministic test scenes.
    systemProperty("java.awt.headless", "true")
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = true
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
    maxHeapSize = "2g"
}
