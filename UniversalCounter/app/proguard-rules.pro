# OpenCV uses JNI; keep its classes and native-facing members.
-keep class org.opencv.** { *; }
-dontwarn org.opencv.**

# Room generated implementations
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-dontwarn androidx.room.paging.**
