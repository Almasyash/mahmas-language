class LanguageModel {
  final String id;
  final String code;
  final String name;
  final String? nativeName;
  final String? flagEmoji;

  const LanguageModel({
    required this.id,
    required this.code,
    required this.name,
    this.nativeName,
    this.flagEmoji,
  });

  factory LanguageModel.fromJson(Map<String, dynamic> json) {
    return LanguageModel(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      nativeName: json['nativeName'] as String?,
      flagEmoji: json['flagEmoji'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'nativeName': nativeName,
      'flagEmoji': flagEmoji,
    };
  }
}

class UserModel {
  final String id;
  final String email;
  final String displayName;
  final String? avatarUrl;
  final String? bio;
  final LanguageModel? nativeLanguage;
  final LanguageModel? targetLanguage;
  final String learningGoal;
  final int dailyMinutesGoal;
  final String currentLevel;
  final String timezone;
  final bool onboardingCompleted;
  final DateTime? createdAt;

  const UserModel({
    required this.id,
    required this.email,
    required this.displayName,
    this.avatarUrl,
    this.bio,
    this.nativeLanguage,
    this.targetLanguage,
    this.learningGoal = 'DAILY_CONVERSATION',
    this.dailyMinutesGoal = 15,
    this.currentLevel = 'A1',
    this.timezone = 'UTC',
    required this.onboardingCompleted,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String? ?? json['userId'] as String? ?? '',
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      bio: json['bio'] as String?,
      nativeLanguage: json['nativeLanguage'] != null
          ? LanguageModel.fromJson(json['nativeLanguage'] as Map<String, dynamic>)
          : null,
      targetLanguage: json['targetLanguage'] != null
          ? LanguageModel.fromJson(json['targetLanguage'] as Map<String, dynamic>)
          : null,
      learningGoal: json['learningGoal'] as String? ?? 'DAILY_CONVERSATION',
      dailyMinutesGoal: json['dailyMinutesGoal'] as int? ?? 15,
      currentLevel: json['currentLevel'] as String? ?? 'A1',
      timezone: json['timezone'] as String? ?? 'UTC',
      onboardingCompleted: json['onboardingCompleted'] as bool? ?? false,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'] as String) : null,
    );
  }

  UserModel copyWith({
    String? displayName,
    String? avatarUrl,
    String? bio,
    LanguageModel? nativeLanguage,
    LanguageModel? targetLanguage,
    String? learningGoal,
    int? dailyMinutesGoal,
    String? currentLevel,
    String? timezone,
    bool? onboardingCompleted,
  }) {
    return UserModel(
      id: id,
      email: email,
      displayName: displayName ?? this.displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      nativeLanguage: nativeLanguage ?? this.nativeLanguage,
      targetLanguage: targetLanguage ?? this.targetLanguage,
      learningGoal: learningGoal ?? this.learningGoal,
      dailyMinutesGoal: dailyMinutesGoal ?? this.dailyMinutesGoal,
      currentLevel: currentLevel ?? this.currentLevel,
      timezone: timezone ?? this.timezone,
      onboardingCompleted: onboardingCompleted ?? this.onboardingCompleted,
      createdAt: createdAt,
    );
  }
}
