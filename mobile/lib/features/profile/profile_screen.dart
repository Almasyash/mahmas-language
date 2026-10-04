import 'package:flutter/material.dart';
import '../../core/auth/auth_scope.dart';
import '../../core/models/progression_model.dart';
import '../../core/models/user_model.dart';
import '../../core/repositories/progression_repository.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isEditing = false;
  bool _isSaving = false;

  final _nameController = TextEditingController();
  final _bioController = TextEditingController();
  int _selectedDailyMinutes = 15;
  String? _selectedTargetLanguageId;

  List<AchievementModel> _achievements = [];
  bool _isLoadingAchievements = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCurrentUserData();
      _loadAchievements();
    });
  }

  Future<void> _loadAchievements() async {
    try {
      final repo = ProgressionRepository(apiClient: AuthScope.of(context).apiClient);
      final list = await repo.getAchievements();
      if (mounted) {
        setState(() {
          _achievements = list;
          _isLoadingAchievements = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoadingAchievements = false;
        });
      }
    }
  }

  void _loadCurrentUserData() {
    final user = AuthScope.of(context).currentUser;
    if (user != null) {
      _nameController.text = user.displayName;
      _bioController.text = user.bio ?? '';
      _selectedDailyMinutes = user.dailyMinutesGoal;
      _selectedTargetLanguageId = user.targetLanguage?.id;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    setState(() {
      _isSaving = true;
    });

    final authNotifier = AuthScope.of(context);
    final success = await authNotifier.updateProfile(
      displayName: _nameController.text.trim(),
      bio: _bioController.text.trim(),
      dailyMinutesGoal: _selectedDailyMinutes,
      targetLanguageId: _selectedTargetLanguageId,
    );

    if (mounted) {
      setState(() {
        _isSaving = false;
        if (success) {
          _isEditing = false;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile updated successfully')),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to update profile')),
          );
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authNotifier = AuthScope.of(context);
    final user = authNotifier.currentUser;
    final theme = Theme.of(context);

    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit Profile',
              onPressed: () {
                setState(() {
                  _isEditing = true;
                  _nameController.text = user.displayName;
                  _bioController.text = user.bio ?? '';
                  _selectedDailyMinutes = user.dailyMinutesGoal;
                  _selectedTargetLanguageId = user.targetLanguage?.id;
                });
              },
            )
          else ...[
            TextButton(
              onPressed: () {
                setState(() {
                  _isEditing = false;
                });
              },
              child: const Text('Cancel'),
            ),
            IconButton(
              icon: _isSaving
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.check),
              tooltip: 'Save',
              onPressed: _isSaving ? null : _handleSave,
            ),
          ],
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // Avatar & Name Card
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 46,
                    backgroundColor: theme.colorScheme.primaryContainer,
                    child: Text(
                      user.displayName.isNotEmpty ? user.displayName[0].toUpperCase() : 'U',
                      style: TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  if (!_isEditing) ...[
                    Text(
                      user.displayName,
                      style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user.email,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    if (user.bio != null && user.bio!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        user.bio!,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyMedium?.copyWith(fontStyle: FontStyle.italic),
                      ),
                    ],
                  ] else ...[
                    TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Display Name',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _bioController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Bio',
                        hintText: 'Share a little about your language journey',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Language & Learning Details
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: theme.colorScheme.outlineVariant),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Learning Journey',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const Divider(height: 24),
                    _buildInfoTile(
                      icon: Icons.language,
                      title: 'Native Language',
                      value: '${user.nativeLanguage?.flagEmoji ?? "🌐"} ${user.nativeLanguage?.name ?? "Not set"}',
                    ),
                    if (!_isEditing)
                      _buildInfoTile(
                        icon: Icons.school_outlined,
                        title: 'Target Language',
                        value: '${user.targetLanguage?.flagEmoji ?? "🌐"} ${user.targetLanguage?.name ?? "Not set"}',
                      )
                    else
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.school_outlined, size: 22),
                                SizedBox(width: 12),
                                Text('Target Language', style: TextStyle(fontWeight: FontWeight.w500)),
                              ],
                            ),
                            DropdownButton<String>(
                              value: _selectedTargetLanguageId,
                              items: LanguageModel.supportedLanguages
                                  .where((l) => l.id != user.nativeLanguage?.id)
                                  .map((lang) => DropdownMenuItem(
                                        value: lang.id,
                                        child: Text('${lang.flagEmoji ?? ""} ${lang.name}'),
                                      ))
                                  .toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedTargetLanguageId = val;
                                  });
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                    _buildInfoTile(
                      icon: Icons.flag_outlined,
                      title: 'Learning Goal',
                      value: user.learningGoal.replaceAll('_', ' '),
                    ),
                    _buildInfoTile(
                      icon: Icons.military_tech_outlined,
                      title: 'Initial Placement',
                      value: 'Level ${user.currentLevel}',
                    ),
                    if (!_isEditing)
                      _buildInfoTile(
                        icon: Icons.timer_outlined,
                        title: 'Daily Goal',
                        value: '${user.dailyMinutesGoal} mins / day',
                      )
                    else ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.timer_outlined, size: 22),
                                SizedBox(width: 12),
                                Text('Daily Goal', style: TextStyle(fontWeight: FontWeight.w500)),
                              ],
                            ),
                            DropdownButton<int>(
                              value: _selectedDailyMinutes,
                              items: const [
                                DropdownMenuItem(value: 5, child: Text('5 mins')),
                                DropdownMenuItem(value: 10, child: Text('10 mins')),
                                DropdownMenuItem(value: 15, child: Text('15 mins')),
                                DropdownMenuItem(value: 20, child: Text('20 mins')),
                                DropdownMenuItem(value: 30, child: Text('30 mins')),
                              ],
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedDailyMinutes = val;
                                  });
                                }
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                    _buildInfoTile(
                      icon: Icons.access_time_outlined,
                      title: 'Timezone',
                      value: user.timezone,
                    ),
                    _buildInfoTile(
                      icon: Icons.check_circle_outline,
                      title: 'Onboarding Status',
                      value: user.onboardingCompleted ? 'Completed' : 'Pending',
                      valueColor: user.onboardingCompleted ? Colors.green : Colors.orange,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Achievements Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Achievements',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '${_achievements.where((a) => a.isUnlocked).length} / ${_achievements.length} Unlocked',
                          style: TextStyle(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (_isLoadingAchievements)
                      const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator()))
                    else if (_achievements.isEmpty)
                      const Text('No achievements available.')
                    else
                      ..._achievements.map((ach) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6.0),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: ach.isUnlocked ? Colors.amber.shade50 : Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  ach.isUnlocked ? Icons.military_tech_rounded : Icons.lock_outline_rounded,
                                  color: ach.isUnlocked ? Colors.amber.shade800 : Colors.grey,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      ach.title,
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                        color: ach.isUnlocked ? Colors.black87 : Colors.grey.shade700,
                                      ),
                                    ),
                                    Text(
                                      ach.description,
                                      style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                              ),
                              if (ach.isUnlocked && ach.unlockedAt != null)
                                Text(
                                  'Unlocked',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green.shade700,
                                  ),
                                )
                              else
                                Text(
                                  '+${ach.xpReward} XP',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.orange.shade800,
                                  ),
                                ),
                            ],
                          ),
                        );
                      }),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Logout Button
            OutlinedButton.icon(
              onPressed: () {
                _confirmLogout(context);
              },
              icon: const Icon(Icons.logout_rounded, color: Colors.red),
              label: const Text('Log Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Logout'),
        content: const Text('Are you sure you want to log out of Mahmas Language?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () {
              Navigator.of(ctx).pop();
              AuthScope.of(context).logout();
            },
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile({
    required IconData icon,
    required String title,
    required String value,
    Color? valueColor,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: Theme.of(context).colorScheme.onSurfaceVariant),
              const SizedBox(width: 12),
              Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
            ],
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }
}
