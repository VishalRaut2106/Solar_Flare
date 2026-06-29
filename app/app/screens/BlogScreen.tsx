import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_CONFIG } from '../utils/constants';
import { logger } from '../utils/logger';
import Header from '../components/Header';
import FloatingNavbar from '../components/FloatingNavbar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import ParticleBackground from '../components/ParticleBackground';

type Props = NativeStackScreenProps<RootStackParamList, 'Blog'>;

const blogArticles = [
  {
    id: '1',
    title: 'Aditya-L1 SoLEXS: Ground Calibration and In-flight Performance',
    excerpt: 'Comprehensive paper on SoLEXS performance, cross-calibration with GOES/XRS, and solar flare studies.',
    author: 'arXiv: 2509.26292',
    date: 'Sep 2025',
    readTime: 'Research Paper',
    category: 'SoLEXS',
    image: require('../../assets/screenshot2.png'),
  },
  {
    id: '2',
    title: 'HEL1OS Instrument Paper: Hard X-ray Spectrometer',
    excerpt: 'Detailed description of HEL1OS and its synergy with SoLEXS for studying thermal vs. non-thermal flare emissions.',
    author: 'arXiv: 2512.12679',
    date: 'Dec 2025',
    readTime: 'Research Paper',
    category: 'HEL1OS',
    image: require('../../assets/screenshot3.png'),
  },
  {
    id: '3',
    title: 'Iron Fluorescence in X-class Solar Flares: SoLEXS Observations',
    excerpt: 'Analysis of spectral features during dozen of X-class flares observed by Aditya-L1. Essential for ML feature engineering.',
    author: 'Solar Physics',
    date: 'May 2025',
    readTime: 'Research Paper',
    category: 'Analysis',
    image: require('../../assets/screenshot1.png'),
  },
  {
    id: '4',
    title: 'Coronal Mass Ejections (Secondary Target)',
    excerpt: 'How we track CMEs via SWIS-ASPEX while focusing on primary Solar Flare predictions.',
    author: 'SolarSim Team',
    date: 'Jan 2026',
    readTime: '5 min read',
    category: 'CME',
    image: require('../../assets/screenshot4.png'),
  },
];

export default function BlogScreen({ navigation }: Props) {
  const handleArticlePress = (articleId: string) => {
    logger.info('Article pressed', { articleId }, 'BlogScreen');
    // TODO: Navigate to article detail page
  };

  const handleCategoryFilter = (category: string) => {
    logger.info('Category filter pressed', { category }, 'BlogScreen');
    // TODO: Filter articles by category
  };

  const handleTabPress = (tab: string) => {
    logger.info('Tab pressed', { tab }, 'BlogScreen');
    switch (tab) {
      case 'home':
        navigation.navigate('Landing');
        break;
      case 'blog':
        // Already on blog
        break;
      case 'chatbot':
        navigation.navigate('Chatbot');
        break;
    }
  };

  const handleBackPress = () => {
    logger.info('Back button pressed', {}, 'BlogScreen');
    navigation.goBack();
  };

  const renderArticle = (article: any) => (
    <TouchableOpacity
      key={article.id}
      style={styles.articleCard}
      onPress={() => handleArticlePress(article.id)}
    >
      <Image source={article.image} style={styles.articleImage} />
      <View style={styles.articleContent}>
        <View style={styles.articleHeader}>
          <Text style={styles.category}>{article.category}</Text>
          <Text style={styles.readTime}>{article.readTime}</Text>
        </View>
        <Text style={styles.articleTitle}>{article.title}</Text>
        <Text style={styles.articleExcerpt}>{article.excerpt}</Text>
        <View style={styles.articleFooter}>
          <Text style={styles.author}>{article.author}</Text>
          <Text style={styles.date}>{article.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ParticleBackground>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <Header 
          title="Scientific Literature" 
          showBackButton={true}
          onBackPress={handleBackPress}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Featured Article */}
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Featured Article</Text>
            <TouchableOpacity style={styles.featuredCard} onPress={() => handleArticlePress('1')}>
              <Image source={blogArticles[0].image} style={styles.featuredImage} />
              <View style={styles.featuredOverlay}>
                <Text style={styles.featuredCategory}>{blogArticles[0].category}</Text>
                <Text style={styles.featuredTitle}>{blogArticles[0].title}</Text>
                <Text style={styles.featuredExcerpt}>{blogArticles[0].excerpt}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {['All', 'SoLEXS', 'HEL1OS', 'Analysis', 'CME'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryChip}
                  onPress={() => handleCategoryFilter(category)}
                >
                  <Text style={styles.categoryChipText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Latest Articles */}
          <View style={styles.articlesSection}>
            <Text style={styles.sectionTitle}>Latest Articles</Text>
            {blogArticles.slice(1).map(renderArticle)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ParticleBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: APP_CONFIG.spacing.lg,
    paddingBottom: APP_CONFIG.spacing.lg,
  },
  featuredSection: {
    marginBottom: APP_CONFIG.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text.primary,
    marginBottom: APP_CONFIG.spacing.md,
  },
  featuredCard: {
    borderRadius: APP_CONFIG.borderRadius.xl,
    overflow: 'hidden',
    ...APP_CONFIG.shadows.medium,
  },
  featuredImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: APP_CONFIG.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  featuredCategory: {
    color: APP_CONFIG.colors.success,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: APP_CONFIG.spacing.xs,
  },
  featuredTitle: {
    color: APP_CONFIG.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: APP_CONFIG.spacing.xs,
  },
  featuredExcerpt: {
    color: APP_CONFIG.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  categoriesSection: {
    marginBottom: APP_CONFIG.spacing.xl,
  },
  categoriesScroll: {
    marginHorizontal: -APP_CONFIG.spacing.lg,
    paddingHorizontal: APP_CONFIG.spacing.lg,
  },
  categoryChip: {
    backgroundColor: APP_CONFIG.colors.secondary,
    paddingHorizontal: APP_CONFIG.spacing.md,
    paddingVertical: APP_CONFIG.spacing.sm,
    borderRadius: APP_CONFIG.borderRadius.full,
    marginRight: APP_CONFIG.spacing.sm,
    ...APP_CONFIG.shadows.light,
  },
  categoryChipText: {
    color: APP_CONFIG.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  articlesSection: {
    marginBottom: APP_CONFIG.spacing.xl,
  },
  articleCard: {
    backgroundColor: APP_CONFIG.colors.secondary,
    borderRadius: APP_CONFIG.borderRadius.xl,
    marginBottom: APP_CONFIG.spacing.md,
    overflow: 'hidden',
    ...APP_CONFIG.shadows.medium,
  },
  articleImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  articleContent: {
    padding: APP_CONFIG.spacing.md,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: APP_CONFIG.spacing.sm,
  },
  category: {
    color: APP_CONFIG.colors.success,
    fontSize: 12,
    fontWeight: 'bold',
  },
  readTime: {
    color: APP_CONFIG.colors.text.tertiary,
    fontSize: 12,
  },
  articleTitle: {
    color: APP_CONFIG.colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: APP_CONFIG.spacing.sm,
    lineHeight: 22,
  },
  articleExcerpt: {
    color: APP_CONFIG.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: APP_CONFIG.spacing.sm,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    color: APP_CONFIG.colors.text.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    color: APP_CONFIG.colors.text.tertiary,
    fontSize: 12,
  },
}); 