// Community feature component - exact reproduction of original functionality
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import type { User } from '../../state/types';

interface CommunityProps {
  currentUser: User | null;
  isDark: boolean;
}

const Community: React.FC<CommunityProps> = ({ currentUser, isDark }) => {
  const [postFilterMarket, setPostFilterMarket] = useState('All');
  const [postSort, setPostSort] = useState('date_desc');
  const [showMine, setShowMine] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState('');
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    market: 'Crypto',
    images: []
  });
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [posts, setPosts] = useState([
    {
      id: 1,
      userId: 1,
      title: 'BTC: лонг после закрепления',
      content: 'BTC: лонг после закрепления над ключевым уровнем. Риск 1%.',
      market: 'Crypto',
      likes: [2],
      comments: [{ id: 1, userId: 2, text: 'Согласен!', date: '2025-01-20' }]
    },
    {
      id: 2,
      userId: 2,
      title: 'NVDA анализ',
      content: 'NVDA показывает признаки разворота. Рассматриваю вход на откате.',
      market: 'Stocks',
      likes: [],
      comments: []
    },
    {
      id: 3,
      userId: 3,
      title: 'ETH краткосрок',
      content: 'Ожидаю откат к 0,5 Fibo и продолжение тренда. Управление риском 0.5%.',
      market: 'Crypto',
      likes: [],
      comments: []
    }
  ]);
  const [bookmarks, setBookmarks] = useState<Record<number, number[]>>({});

  const isBookmarked = (postId: number) => {
    const uid = currentUser?.id;
    if (!uid) return false;
    const list = bookmarks[uid] || [];
    return list.includes(postId);
  };

  const toggleBookmark = (postId: number) => {
    const uid = currentUser?.id;
    if (!uid) return;
    setBookmarks(prev => {
      const list = prev[uid] || [];
      const nextList = list.includes(postId) ? list.filter(id => id !== postId) : [...list, postId];
      return { ...prev, [uid]: nextList };
    });
  };

  const toggleLike = (postId: number) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const likes = post.likes || [];
        const isLiked = likes.includes(currentUser.id);
        return {
          ...post,
          likes: isLiked 
            ? likes.filter(id => id !== currentUser.id)
            : [...likes, currentUser.id]
        };
      }
      return post;
    }));
  };

  const addComment = (postId: number) => {
    if (!currentUser) return;
    const commentText = commentDrafts[postId]?.trim();
    if (!commentText) return;

    const newComment = {
      id: Date.now(),
      userId: currentUser.id,
      text: commentText,
      date: new Date().toISOString().slice(0, 10)
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment]
        };
      }
      return post;
    }));

    setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
  };

  const addPost = () => {
    if (!currentUser || !newPost.title || !newPost.content) return;

    const post = {
      id: Date.now(),
      userId: currentUser.id,
      ...newPost
    };

    setPosts(prev => [post, ...prev]);
    setNewPost({ title: '', content: '', market: 'Crypto', images: [] });
  };

  const filteredPosts = posts.filter(post => {
    if (postFilterMarket !== 'All' && post.market !== postFilterMarket) return false;
    if (showMine && post.userId !== currentUser?.id) return false;
    if (showBookmarksOnly && !isBookmarked(post.id)) return false;
    if (hashtagFilter) {
      const searchText = hashtagFilter.toLowerCase();
      return post.title.toLowerCase().includes(searchText) || 
             post.content.toLowerCase().includes(searchText);
    }
    return true;
  }).sort((a, b) => {
    if (postSort === 'likes_desc') {
      return (b.likes?.length || 0) - (a.likes?.length || 0);
    }
    return b.id - a.id; // date_desc
  });

  return (
    <View style={[styles.container, isDark ? styles.darkContainer : null]}>
      {/* New post form */}
      <View style={[styles.card, isDark ? styles.cardDark : null]}>
        <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
          ✍️ Создать пост
        </Text>
        {!currentUser && (
          <Text style={[styles.noteText, isDark ? styles.noteTextDark : null]}>
            Войдите, чтобы создавать посты
          </Text>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.labelDark : null]}>Заголовок</Text>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : null]}
            value={newPost.title}
            onChangeText={(t) => setNewPost(v => ({ ...v, title: t }))}
            placeholder="Заголовок поста"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.labelDark : null]}>Содержание</Text>
          <TextInput
            style={[styles.textArea, isDark ? styles.textAreaDark : null]}
            value={newPost.content}
            onChangeText={(t) => setNewPost(v => ({ ...v, content: t }))}
            placeholder="Ваш анализ или мнение..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.labelDark : null]}>Рынок</Text>
          <View style={styles.pickerContainer}>
            {['All', 'Crypto', 'Stocks', 'Forex', 'Metals'].map(market => (
              <Pressable
                key={market}
                style={[
                  styles.pickerOption,
                  isDark ? styles.pickerOptionDark : null,
                  newPost.market === market ? styles.pickerOptionActive : null
                ]}
                onPress={() => setNewPost(v => ({ ...v, market }))}
              >
                <Text style={[
                  styles.pickerText,
                  isDark ? styles.pickerTextDark : null,
                  newPost.market === market ? styles.pickerTextActive : null
                ]}>
                  {market}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.addButton} onPress={addPost}>
          <Text style={styles.addButtonText}>Опубликовать</Text>
        </Pressable>
      </View>

      {/* Filters */}
      <View style={[styles.card, isDark ? styles.cardDark : null]}>
        <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
          🔍 Фильтры
        </Text>
        
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark ? styles.labelDark : null]}>Рынок</Text>
            <View style={styles.pickerContainer}>
              {['All', 'Crypto', 'Stocks', 'Forex', 'Metals'].map(market => (
                <Pressable
                  key={market}
                  style={[
                    styles.pickerOption,
                    isDark ? styles.pickerOptionDark : null,
                    postFilterMarket === market ? styles.pickerOptionActive : null
                  ]}
                  onPress={() => setPostFilterMarket(market)}
                >
                  <Text style={[
                    styles.pickerText,
                    isDark ? styles.pickerTextDark : null,
                    postFilterMarket === market ? styles.pickerTextActive : null
                  ]}>
                    {market}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark ? styles.labelDark : null]}>Поиск</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : null]}
              value={hashtagFilter}
              onChangeText={setHashtagFilter}
              placeholder="Поиск по заголовку или содержанию"
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <Pressable
            style={[
              styles.filterButton,
              isDark ? styles.filterButtonDark : null,
              showMine ? styles.filterButtonActive : null
            ]}
            onPress={() => setShowMine(!showMine)}
          >
            <Text style={[
              styles.filterButtonText,
              isDark ? styles.filterButtonTextDark : null,
              showMine ? styles.filterButtonTextActive : null
            ]}>
              Мои посты
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterButton,
              isDark ? styles.filterButtonDark : null,
              showBookmarksOnly ? styles.filterButtonActive : null
            ]}
            onPress={() => setShowBookmarksOnly(!showBookmarksOnly)}
          >
            <Text style={[
              styles.filterButtonText,
              isDark ? styles.filterButtonTextDark : null,
              showBookmarksOnly ? styles.filterButtonTextActive : null
            ]}>
              Закладки
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Posts list */}
      <View style={[styles.card, isDark ? styles.cardDark : null]}>
        <Text style={[styles.cardTitle, isDark ? styles.cardTitleDark : null]}>
          📊 Лента сообщества ({filteredPosts.length})
        </Text>
        
        <ScrollView style={styles.postsList}>
          {filteredPosts.map(post => (
            <View key={post.id} style={[styles.post, isDark ? styles.postDark : null]}>
              <View style={styles.postHeader}>
                <Text style={[styles.postTitle, isDark ? styles.postTitleDark : null]}>
                  {post.title}
                </Text>
                <Text style={[styles.postMarket, isDark ? styles.postMarketDark : null]}>
                  {post.market}
                </Text>
              </View>
              
              <Text style={[styles.postContent, isDark ? styles.postContentDark : null]}>
                {post.content}
              </Text>
              
              <View style={styles.postActions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => toggleLike(post.id)}
                >
                  <Text style={[
                    styles.actionButtonText,
                    (post.likes?.includes(currentUser?.id || 0)) ? styles.actionButtonTextActive : null
                  ]}>
                    ❤️ {post.likes?.length || 0}
                  </Text>
                </Pressable>
                
                <Pressable
                  style={styles.actionButton}
                  onPress={() => toggleBookmark(post.id)}
                >
                  <Text style={[
                    styles.actionButtonText,
                    isBookmarked(post.id) ? styles.actionButtonTextActive : null
                  ]}>
                    🔖
                  </Text>
                </Pressable>
              </View>
              
              {/* Comments */}
              <View style={styles.commentsContainer}>
                <Text style={[styles.commentsTitle, isDark ? styles.commentsTitleDark : null]}>
                  Комментарии ({post.comments?.length || 0})
                </Text>
                
                {post.comments?.map(comment => (
                  <View key={comment.id} style={[styles.comment, isDark ? styles.commentDark : null]}>
                    <Text style={[styles.commentText, isDark ? styles.commentTextDark : null]}>
                      {comment.text}
                    </Text>
                    <Text style={[styles.commentDate, isDark ? styles.commentDateDark : null]}>
                      {comment.date}
                    </Text>
                  </View>
                ))}
                
                {currentUser && (
                  <View style={styles.commentInput}>
                    <TextInput
                      style={[styles.commentInputField, isDark ? styles.commentInputFieldDark : null]}
                      value={commentDrafts[post.id] || ''}
                      onChangeText={(text) => setCommentDrafts(prev => ({ ...prev, [post.id]: text }))}
                      placeholder="Добавить комментарий..."
                      placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                    />
                    <Pressable
                      style={styles.commentButton}
                      onPress={() => addComment(post.id)}
                    >
                      <Text style={styles.commentButtonText}>Отправить</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))}
          
          {filteredPosts.length === 0 && (
            <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : null]}>
              Постов не найдено
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  darkContainer: {
    backgroundColor: '#0b0f14',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#121820',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  cardTitleDark: {
    color: '#e6edf3',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  labelDark: {
    color: '#d1d5db',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  inputDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
    color: '#e6edf3',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
  },
  textAreaDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
    color: '#e6edf3',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  pickerOptionDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  pickerOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  pickerTextDark: {
    color: '#d1d5db',
  },
  pickerTextActive: {
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  noteTextDark: {
    color: '#9ca3af',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    marginRight: 8,
  },
  filterButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextDark: {
    color: '#d1d5db',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  postsList: {
    maxHeight: 600,
  },
  post: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  postDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  postTitleDark: {
    color: '#e6edf3',
  },
  postMarket: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  postMarketDark: {
    color: '#9ca3af',
    backgroundColor: '#374151',
  },
  postContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  postContentDark: {
    color: '#d1d5db',
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtonTextActive: {
    color: '#3b82f6',
  },
  commentsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  commentsTitleDark: {
    color: '#d1d5db',
  },
  comment: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  commentDark: {
    backgroundColor: '#374151',
  },
  commentText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  commentTextDark: {
    color: '#d1d5db',
  },
  commentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentDateDark: {
    color: '#6b7280',
  },
  commentInput: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  commentInputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  commentInputFieldDark: {
    borderColor: '#374151',
    backgroundColor: '#1f2937',
    color: '#e6edf3',
  },
  commentButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  emptyTextDark: {
    color: '#9ca3af',
  },
});

export default Community;