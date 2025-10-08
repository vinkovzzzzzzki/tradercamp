// Community feature component - exact reproduction of original functionality
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, Image } from 'react-native';
import type { User, Post } from '../../state/types';

interface CommunityProps {
  currentUser: User | null;
  isDark: boolean;
  posts: Post[];
  bookmarks: Record<string, number[]>;
  onAddPost: (post: Omit<Post, 'id' | 'userId' | 'date' | 'likes' | 'comments'>) => void;
  onDeletePost: (id: number) => void;
  onToggleLike: (postId: number) => void;
  onAddComment: (postId: number, text: string) => void;
  onToggleBookmark: (postId: number) => void;
}

const Community: React.FC<CommunityProps> = ({ 
  currentUser, 
  isDark,
  posts,
  bookmarks,
  onAddPost,
  onDeletePost,
  onToggleLike,
  onAddComment,
  onToggleBookmark
}) => {
  const [postFilterMarket, setPostFilterMarket] = useState('All');
  const [postSort, setPostSort] = useState('date_desc');
  const [showMine, setShowMine] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState('');
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    market: 'Crypto',
    images: [] as string[]
  });
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [selectedUserProfile, setSelectedUserProfile] = useState<string | number | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const isBookmarked = (postId: number) => {
    if (!currentUser) return false;
    return bookmarks[currentUser.id]?.includes(postId) || false;
  };

  const handleAddPost = () => {
    if (!currentUser || !newPost.title || !newPost.content) return;
    onAddPost(newPost);
    setNewPost({ title: '', content: '', market: 'Crypto', images: [] });
    setImageUrl('');
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setNewPost(prev => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()]
      }));
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setNewPost(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddComment = (postId: number) => {
    const commentText = commentDrafts[postId]?.trim();
    if (!commentText) return;
    onAddComment(postId, commentText);
    setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
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
  }, [posts, postFilterMarket, showMine, showBookmarksOnly, hashtagFilter, postSort, currentUser, isBookmarked]);

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

        {/* Image upload */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.labelDark : null]}>Изображения</Text>
          <View style={styles.imageUploadContainer}>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : null, { flex: 1 }]}
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="URL изображения"
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            />
            <Pressable style={styles.addImageButton} onPress={handleAddImage}>
              <Text style={styles.addImageButtonText}>+ Добавить</Text>
            </Pressable>
          </View>
          {newPost.images.length > 0 && (
            <View style={styles.imagePreviewContainer}>
              {newPost.images.map((img, idx) => (
                <View key={idx} style={styles.imagePreview}>
                  <Image source={{ uri: img }} style={styles.previewImage} />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={() => removeImage(idx)}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable style={styles.addButton} onPress={handleAddPost}>
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
                    <Pressable onPress={() => setSelectedUserProfile(post.userId)}>
                      <Text style={[styles.postAuthor, isDark ? styles.postAuthorDark : null]}>
                        @user{post.userId}
                      </Text>
                    </Pressable>
                    <Text style={[styles.postMarket, isDark ? styles.postMarketDark : null]}>
                      {post.market}
                    </Text>
                  </View>
                  
                  <Text style={[styles.postTitle, isDark ? styles.postTitleDark : null]}>
                    {post.title}
                  </Text>
                  
                  <Text style={[styles.postContent, isDark ? styles.postContentDark : null]}>
                    {post.content}
                  </Text>
                  
                  {/* Post images */}
                  {post.images && post.images.length > 0 && (
                    <ScrollView horizontal style={styles.postImagesContainer}>
                      {post.images.map((img, idx) => (
                        <Image
                          key={idx}
                          source={{ uri: img }}
                          style={styles.postImage}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  )}
              
                  <View style={styles.postActions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => onToggleLike(post.id)}
                    >
                      <Text style={[
                        styles.actionButtonText,
                        (post.likes?.includes(currentUser?.id || '')) ? styles.actionButtonTextActive : null
                      ]}>
                        ❤️ {post.likes?.length || 0}
                      </Text>
                    </Pressable>
                    
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => onToggleBookmark(post.id)}
                    >
                      <Text style={[
                        styles.actionButtonText,
                        isBookmarked(post.id) ? styles.actionButtonTextActive : null
                      ]}>
                        🔖
                      </Text>
                    </Pressable>
                    
                    {currentUser?.id === post.userId && (
                      <Pressable
                        style={styles.actionButton}
                        onPress={() => onDeletePost(post.id)}
                      >
                        <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
                          🗑️ Удалить
                        </Text>
                      </Pressable>
                    )}
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
                      onPress={() => handleAddComment(post.id)}
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

      {/* User Profile Modal */}
      <Modal visible={selectedUserProfile !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark ? styles.modalContentDark : null]}>
            <Text style={[styles.modalTitle, isDark ? styles.modalTitleDark : null]}>
              Профиль @user{selectedUserProfile}
            </Text>
            
            <View style={styles.profileInfo}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>U</Text>
              </View>
              <Text style={[styles.profileNickname, isDark ? styles.profileNicknameDark : null]}>
                @user{selectedUserProfile}
              </Text>
              <Text style={[styles.profileBio, isDark ? styles.profileBioDark : null]}>
                Пользователь #{selectedUserProfile}
              </Text>
            </View>

            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={[styles.profileStatValue, isDark ? styles.profileStatValueDark : null]}>
                  {posts.filter(p => p.userId === selectedUserProfile).length}
                </Text>
                <Text style={[styles.profileStatLabel, isDark ? styles.profileStatLabelDark : null]}>
                  Постов
                </Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={[styles.profileStatValue, isDark ? styles.profileStatValueDark : null]}>
                  {posts.filter(p => p.userId === selectedUserProfile).reduce((sum, p) => sum + (p.likes?.length || 0), 0)}
                </Text>
                <Text style={[styles.profileStatLabel, isDark ? styles.profileStatLabelDark : null]}>
                  Лайков
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.modalButton, styles.closeModalButton]}
              onPress={() => setSelectedUserProfile(null)}
            >
              <Text style={styles.closeModalButtonText}>Закрыть</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  imageUploadContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  addImageButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  imagePreview: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  postImagesContainer: {
    marginVertical: 12,
  },
  postImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginRight: 8,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  postAuthorDark: {
    color: '#60a5fa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalContentDark: {
    backgroundColor: '#121820',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTitleDark: {
    color: '#e6edf3',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  profileNickname: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  profileNicknameDark: {
    color: '#e6edf3',
  },
  profileBio: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  profileBioDark: {
    color: '#9ca3af',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  profileStatValueDark: {
    color: '#60a5fa',
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  profileStatLabelDark: {
    color: '#9ca3af',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButton: {
    backgroundColor: '#e5e7eb',
  },
  closeModalButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Community;