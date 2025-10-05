// Community feature component
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image, StyleSheet } from 'react-native';
import type { User } from '../../state/types';

interface CommunityProps {
  currentUser: User | null;
  isDark: boolean;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  category: string;
}

interface Friend {
  id: number;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

const Community: React.FC<CommunityProps> = ({ currentUser, isDark }) => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'Алексей Финансов',
      avatar: '👨‍💼',
      content: 'Сегодня достиг цели по накоплению резервного фонда! 6 месяцев расходов в запасе. Кто еще ставил себе такие цели?',
      timestamp: '2 часа назад',
      likes: 12,
      comments: 5,
      isLiked: false,
      category: 'Достижения'
    },
    {
      id: 2,
      author: 'Мария Инвестор',
      avatar: '👩‍💻',
      content: 'Поделитесь опытом инвестирования в ETF. Какие фонды предпочитаете?',
      timestamp: '4 часа назад',
      likes: 8,
      comments: 12,
      isLiked: true,
      category: 'Инвестиции'
    },
    {
      id: 3,
      author: 'Дмитрий Планировщик',
      avatar: '👨‍🎓',
      content: 'Создал план погашения долгов на 2024 год. Осталось 8 месяцев до полной свободы от кредитов!',
      timestamp: '1 день назад',
      likes: 15,
      comments: 8,
      isLiked: false,
      category: 'Планирование'
    }
  ]);

  const [friends, setFriends] = useState<Friend[]>([
    {
      id: 1,
      name: 'Анна Сберегатель',
      avatar: '👩‍💼',
      status: 'online',
      lastSeen: 'сейчас'
    },
    {
      id: 2,
      name: 'Сергей Трейдер',
      avatar: '👨‍💻',
      status: 'offline',
      lastSeen: '2 часа назад'
    },
    {
      id: 3,
      name: 'Елена Бюджет',
      avatar: '👩‍🎓',
      status: 'online',
      lastSeen: 'сейчас'
    }
  ]);

  const [newPost, setNewPost] = useState({
    content: '',
    category: 'Общее'
  });

  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'groups'>('feed');

  const addPost = () => {
    if (!newPost.content || !currentUser) return;
    
    const post: Post = {
      id: Date.now(),
      author: currentUser.nickname,
      avatar: '👤',
      content: newPost.content,
      timestamp: 'только что',
      likes: 0,
      comments: 0,
      isLiked: false,
      category: newPost.category
    };
    
    setPosts(prev => [post, ...prev]);
    setNewPost({ content: '', category: 'Общее' });
  };

  const toggleLike = (id: number) => {
    setPosts(prev => prev.map(post => 
      post.id === id 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Достижения': return '#10b981';
      case 'Инвестиции': return '#3b82f6';
      case 'Планирование': return '#f59e0b';
      case 'Общее': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <ScrollView style={[styles.container, isDark ? styles.containerDark : null]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark ? styles.titleDark : null]}>
          Сообщество
        </Text>
        <Text style={[styles.subtitle, isDark ? styles.subtitleDark : null]}>
          Общайтесь с единомышленниками
        </Text>
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabs, isDark ? styles.tabsDark : null]}>
        {[
          { key: 'feed', label: 'Лента' },
          { key: 'friends', label: 'Друзья' },
          { key: 'groups', label: 'Группы' }
        ].map(({ key, label }) => (
          <Pressable
            key={key}
            style={[
              styles.tab,
              activeTab === key ? styles.tabActive : null
            ]}
            onPress={() => setActiveTab(key as any)}
          >
            <Text style={[
              styles.tabText,
              activeTab === key ? styles.tabTextActive : null
            ]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <View>
          {/* New Post Form */}
          <View style={[styles.newPostForm, isDark ? styles.newPostFormDark : null]}>
            <Text style={[styles.formTitle, isDark ? styles.formTitleDark : null]}>
              Поделитесь мыслями
            </Text>
            
            <TextInput
              style={[styles.postInput, isDark ? styles.postInputDark : null]}
              placeholder="Что у вас на уме?"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={newPost.content}
              onChangeText={(text) => setNewPost(prev => ({ ...prev, content: text }))}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.postActions}>
              <View style={styles.categorySelector}>
                <Text style={[styles.categoryLabel, isDark ? styles.categoryLabelDark : null]}>
                  Категория:
                </Text>
                {['Общее', 'Достижения', 'Инвестиции', 'Планирование'].map(category => (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryButton,
                      newPost.category === category ? styles.categoryButtonActive : null,
                      { borderColor: getCategoryColor(category) }
                    ]}
                    onPress={() => setNewPost(prev => ({ ...prev, category }))}
                  >
                    <Text style={[
                      styles.categoryText,
                      newPost.category === category ? { color: getCategoryColor(category) } : null
                    ]}>
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
              
              <Pressable style={styles.publishButton} onPress={addPost}>
                <Text style={styles.publishButtonText}>Опубликовать</Text>
              </Pressable>
            </View>
          </View>

          {/* Posts Feed */}
          <View style={styles.postsList}>
            {posts.map(post => (
              <View key={post.id} style={[styles.post, isDark ? styles.postDark : null]}>
                <View style={styles.postHeader}>
                  <View style={styles.authorInfo}>
                    <Text style={styles.avatar}>{post.avatar}</Text>
                    <View>
                      <Text style={[styles.authorName, isDark ? styles.authorNameDark : null]}>
                        {post.author}
                      </Text>
                      <Text style={[styles.timestamp, isDark ? styles.timestampDark : null]}>
                        {post.timestamp}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(post.category) }]}>
                    <Text style={styles.categoryBadgeText}>{post.category}</Text>
                  </View>
                </View>
                
                <Text style={[styles.postContent, isDark ? styles.postContentDark : null]}>
                  {post.content}
                </Text>
                
                <View style={styles.postFooter}>
                  <Pressable
                    style={styles.likeButton}
                    onPress={() => toggleLike(post.id)}
                  >
                    <Text style={[
                      styles.likeIcon,
                      post.isLiked ? styles.likeIconActive : null
                    ]}>
                      {post.isLiked ? '❤️' : '🤍'}
                    </Text>
                    <Text style={[styles.likeCount, isDark ? styles.likeCountDark : null]}>
                      {post.likes}
                    </Text>
                  </Pressable>
                  
                  <Pressable style={styles.commentButton}>
                    <Text style={styles.commentIcon}>💬</Text>
                    <Text style={[styles.commentCount, isDark ? styles.commentCountDark : null]}>
                      {post.comments}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <View style={styles.friendsList}>
          <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
            Ваши друзья ({friends.length})
          </Text>
          
          {friends.map(friend => (
            <View key={friend.id} style={[styles.friend, isDark ? styles.friendDark : null]}>
              <View style={styles.friendInfo}>
                <Text style={styles.friendAvatar}>{friend.avatar}</Text>
                <View>
                  <Text style={[styles.friendName, isDark ? styles.friendNameDark : null]}>
                    {friend.name}
                  </Text>
                  <View style={styles.friendStatus}>
                    <View style={[
                      styles.statusDot,
                      friend.status === 'online' ? styles.statusDotOnline : styles.statusDotOffline
                    ]} />
                    <Text style={[styles.statusText, isDark ? styles.statusTextDark : null]}>
                      {friend.status === 'online' ? 'В сети' : `Был(а) ${friend.lastSeen}`}
                    </Text>
                  </View>
                </View>
              </View>
              
              <Pressable style={styles.messageButton}>
                <Text style={styles.messageButtonText}>Написать</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <View style={styles.groupsList}>
          <Text style={[styles.sectionTitle, isDark ? styles.sectionTitleDark : null]}>
            Группы
          </Text>
          
          <View style={[styles.group, isDark ? styles.groupDark : null]}>
            <Text style={styles.groupEmoji}>💰</Text>
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, isDark ? styles.groupNameDark : null]}>
                Финансовая грамотность
              </Text>
              <Text style={[styles.groupDescription, isDark ? styles.groupDescriptionDark : null]}>
                1,234 участника • Обсуждение основ финансовой грамотности
              </Text>
            </View>
            <Pressable style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Присоединиться</Text>
            </Pressable>
          </View>
          
          <View style={[styles.group, isDark ? styles.groupDark : null]}>
            <Text style={styles.groupEmoji}>📈</Text>
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, isDark ? styles.groupNameDark : null]}>
                Инвестиции для начинающих
              </Text>
              <Text style={[styles.groupDescription, isDark ? styles.groupDescriptionDark : null]}>
                856 участников • Советы по инвестированию
              </Text>
            </View>
            <Pressable style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Присоединиться</Text>
            </Pressable>
          </View>
          
          <View style={[styles.group, isDark ? styles.groupDark : null]}>
            <Text style={styles.groupEmoji}>🎯</Text>
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, isDark ? styles.groupNameDark : null]}>
                Достижение целей
              </Text>
              <Text style={[styles.groupDescription, isDark ? styles.groupDescriptionDark : null]}>
                2,156 участников • Мотивация и достижение финансовых целей
              </Text>
            </View>
            <Pressable style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Присоединиться</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#0d1117',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  titleDark: {
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  subtitleDark: {
    color: '#9ca3af',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  tabsDark: {
    backgroundColor: '#21262d',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  newPostForm: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newPostFormDark: {
    backgroundColor: '#161b22',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  formTitleDark: {
    color: '#f9fafb',
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    textAlignVertical: 'top',
  },
  postInputDark: {
    borderColor: '#374151',
    backgroundColor: '#21262d',
    color: '#f9fafb',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#1f2937',
    marginRight: 8,
  },
  categoryLabelDark: {
    color: '#f9fafb',
  },
  categoryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryButtonActive: {
    backgroundColor: '#f3f4f6',
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
  },
  publishButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  publishButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  postsList: {
    gap: 16,
  },
  post: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postDark: {
    backgroundColor: '#161b22',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    fontSize: 24,
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  authorNameDark: {
    color: '#f9fafb',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  timestampDark: {
    color: '#9ca3af',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  postContent: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    marginBottom: 12,
  },
  postContentDark: {
    color: '#f9fafb',
  },
  postFooter: {
    flexDirection: 'row',
    gap: 24,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeIcon: {
    fontSize: 16,
  },
  likeIconActive: {
    fontSize: 16,
  },
  likeCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  likeCountDark: {
    color: '#9ca3af',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentIcon: {
    fontSize: 16,
  },
  commentCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  commentCountDark: {
    color: '#9ca3af',
  },
  friendsList: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#f9fafb',
  },
  friend: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  friendDark: {
    backgroundColor: '#161b22',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  friendNameDark: {
    color: '#f9fafb',
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOnline: {
    backgroundColor: '#10b981',
  },
  statusDotOffline: {
    backgroundColor: '#6b7280',
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusTextDark: {
    color: '#9ca3af',
  },
  messageButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  groupsList: {
    gap: 12,
  },
  group: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupDark: {
    backgroundColor: '#161b22',
  },
  groupEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  groupNameDark: {
    color: '#f9fafb',
  },
  groupDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  groupDescriptionDark: {
    color: '#9ca3af',
  },
  joinButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Community;
