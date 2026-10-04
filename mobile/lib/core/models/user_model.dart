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

  static const List<LanguageModel> supportedLanguages = [
    LanguageModel(id: 'ea32166d-485c-4b0e-a0b5-7ccfca10be7c', code: 'en', name: 'English', nativeName: 'English', flagEmoji: '🇬🇧'),
    LanguageModel(id: 'eb922fb1-e918-42a3-bf66-7bc28836c088', code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flagEmoji: '🇮🇳'),
    LanguageModel(id: 'c383294c-80aa-4ef6-a1b9-0b405ed0e1b4', code: 'es', name: 'Spanish', nativeName: 'Español', flagEmoji: '🇪🇸'),
    LanguageModel(id: 'cffd17f5-413d-4fcb-ab58-21b04ac340d7', code: 'fr', name: 'French', nativeName: 'Français', flagEmoji: '🇫🇷'),
    LanguageModel(id: '5b962716-d1c7-40cb-b6d3-fc837cbd6986', code: 'de', name: 'German', nativeName: 'Deutsch', flagEmoji: '🇩🇪'),
    LanguageModel(id: 'b538fd7f-41a9-4c4f-ae1e-82f662dbc373', code: 'ar', name: 'Arabic', nativeName: 'العربية', flagEmoji: '🇸🇦'),
    LanguageModel(id: 'b5addf68-bbca-404e-bcec-4c2286124435', code: 'ja', name: 'Japanese', nativeName: '日本語', flagEmoji: '🇯🇵'),
    LanguageModel(id: '31b8b81e-4f2b-4bb9-b176-053b5e39f35c', code: 'ko', name: 'Korean', nativeName: '한국어', flagEmoji: '🇰🇷'),
    LanguageModel(id: 'f8ded5ea-afa3-40fb-b55f-8b54479729de', code: 'zh', name: 'Mandarin Chinese', nativeName: '中文', flagEmoji: '🇨🇳'),
    LanguageModel(id: 'bd3b73cc-06ff-4032-9474-09ce689045b9', code: 'it', name: 'Italian', nativeName: 'Italiano', flagEmoji: '🇮🇹'),
    LanguageModel(id: '6857d6dd-eece-4241-9fbd-742a3d4b47d7', code: 'pt', name: 'Portuguese', nativeName: 'Português', flagEmoji: '🇧🇷'),
    LanguageModel(id: '744101c5-03d9-40c5-9cfb-de3977ed89f3', code: 'ru', name: 'Russian', nativeName: 'Русский', flagEmoji: '🇷🇺'),
  ];
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
