import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { APP_CONFIG, SENSOR_DATA, TRENDING_DATA } from '../utils/constants';
import { logger } from '../utils/logger';
import { screenDimensions, getTrendIcon, getTrendColor } from '../utils/helpers';
import FloatingNavbar from '../components/FloatingNavbar';
import ParticleBackground from '../components/ParticleBackground';
// Removed static import alertData from '../../flare_alerts.json';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

const { width: screenWidth } = Dimensions.get('window');

export default function Landing({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [liveData, setLiveData] = useState({
    timestamp: "Loading...",
    flare_probability: 0,
    alert_level: "LOW",
    lead_time_mins: 15,
    method: "Loading Live Model...",
    cme_alert: false,
    cme_class: "None",
    sensors: {
      swis_speed: 450.0,
      aspex_flux: "3.2e+08",
      papa_density: 5.40,
      suit_uv: 1.20
    },
    trending: [
      { id: "1", name: "Magnetic Field", change: "↑ 2.1 nT", trendUp: true },
      { id: "2", name: "Solar Wind", change: "↑ 450.0 km/s", trendUp: true },
      { id: "3", name: "Particle Density", change: "↑ 5.4 cm³", trendUp: true }
    ]
  });
  const [lightcurveUrl, setLightcurveUrl] = useState("https://solar-flare-53ly.onrender.com/api/v1/lightcurve");
  const [countdown, setCountdown] = useState(60);
  const [isGraphModalVisible, setGraphModalVisible] = useState(false);
  const [isTelemetryModalVisible, setTelemetryModalVisible] = useState(false);
  const [connectionState, setConnectionState] = useState<'booting_cloud' | 'connected' | 'disconnected'>('booting_cloud');
  const [hasAcknowledgedAlert, setHasAcknowledgedAlert] = useState(false);

  useEffect(() => {
    // Fetch live data from backend
    const fetchData = async () => {
      try {
        const res = await fetch("https://solar-flare-53ly.onrender.com/api/v1/status", {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        const text = await res.text();
        if (text.startsWith('<')) {
          setConnectionState('booting_cloud');
          return;
        }
        
        const data = JSON.parse(text);
        if (data.timestamp) {
          setLiveData(data);
          setConnectionState('connected');
          // Reset acknowledgment if alert level drops
          if (!data.cme_alert && data.alert_level !== 'HIGH') {
            setHasAcknowledgedAlert(false);
          }
          // Force image refresh by appending a timestamp query param
          setLightcurveUrl(`https://solar-flare-53ly.onrender.com/api/v1/lightcurve?t=${new Date().getTime()}`);
        }
      } catch (err) {
        console.log("Failed to fetch live data", err);
        setConnectionState('disconnected');
      }
    };
    
    fetchData();
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for CME counter
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleNavigation = (screen: keyof RootStackParamList) => {
    logger.info(`Navigating to ${screen}`, {}, 'Landing');
    navigation.navigate(screen);
  };

  const handleSearchPress = () => {
    logger.info('Search button pressed', {}, 'Landing');
    handleNavigation('Search');
  };

  const handleTelemetryPress = () => {
    setTelemetryModalVisible(true);
  };

  const handleTabPress = (tab: string) => {
    logger.info('Tab pressed', { tab }, 'Landing');
    switch (tab) {
      case 'home':
        // Already on home
        break;
      case 'blog':
        handleNavigation('Blog');
        break;
      case 'chatbot':
        handleNavigation('Chatbot');
        break;
    }
  };

  const renderSensorCard = ({ item, index }: { item: any; index: number }) => (
    <Animated.View 
      style={[
        styles.card,
        {
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconContainer}>
          <Ionicons name="analytics" size={20} color={APP_CONFIG.colors.info} />
        </View>
        <View style={styles.cardTrend}>
          <MaterialIcons
            name={getTrendIcon(item.trendUp)}
            size={16}
            color={getTrendColor(item.trendUp, APP_CONFIG.colors)}
          />
          <Text
            style={[styles.cardTrendText, { color: getTrendColor(item.trendUp, APP_CONFIG.colors) }]}
          >
            {item.trendUp ? '↗' : '↘'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardSymbol}>{item.name}</Text>
      <Text style={styles.cardName}>{item.desc}</Text>
      <Text style={styles.cardPrice}>{item.reading}</Text>
      <Image source={item.graph} style={styles.graphImage} />
    </Animated.View>
  );

  const renderTrendingItem = (item: any, index: number) => (
    <Animated.View 
      key={item.id} 
      style={[
        styles.trendingRow,
        {
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      <View style={styles.trendingLeft}>
        <View style={styles.trendingIcon}>
          <Ionicons name="trending-up" size={16} color={getTrendColor(item.trendUp, APP_CONFIG.colors)} />
        </View>
        <Text style={styles.trendingName}>{item.name}</Text>
      </View>
      <View style={styles.cardTrend}>
        <Text
          style={[styles.trendingChange, { color: getTrendColor(item.trendUp, APP_CONFIG.colors) }]}
        >
          {item.change}
        </Text>
      </View>
    </Animated.View>
  );

  const dynamicSensors = [
    {
      id: '1',
      name: 'SWIS',
      desc: 'Solar Wind Speed',
      reading: `${liveData.sensors?.swis_speed || '450.0'} km/s`,
      trendUp: true,
      graph: require('../../assets/graph_01.png'),
    },
    {
      id: '2',
      name: 'ASPEX',
      desc: 'Proton Flux',
      reading: `${liveData.sensors?.aspex_flux || '3.2e+08'}`,
      trendUp: (liveData.flare_probability > 0.4),
      graph: require('../../assets/graph_02.png'),
    },
    {
      id: '3',
      name: 'PAPA',
      desc: 'Plasma Density',
      reading: `${liveData.sensors?.papa_density || '5.4'} cm³`,
      trendUp: true,
      graph: require('../../assets/graph_03.png'),
    },
    {
      id: '4',
      name: 'SUIT',
      desc: 'UV Intensity',
      reading: `${liveData.sensors?.suit_uv || '1.2'} mW/m²`,
      trendUp: true,
      graph: require('../../assets/graph_01.png'),
    },
  ];

  return (
    <ParticleBackground>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <BlurView intensity={40} tint="dark" style={styles.blurTop} />
        
        {connectionState === 'disconnected' && (
          <View style={{ backgroundColor: APP_CONFIG.colors.error, padding: 8, alignItems: 'center', zIndex: 100 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>CONNECTION LOST: Attempting to re-establish proxy link...</Text>
          </View>
        )}
        {connectionState === 'booting_cloud' && (
          <View style={{ backgroundColor: APP_CONFIG.colors.warning, padding: 8, alignItems: 'center', zIndex: 100 }}>
            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 12 }}>Initializing Cloud Inference Engine (Cold Start)...</Text>
          </View>
        )}

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <FontAwesome5 name="sun" size={24} color={APP_CONFIG.colors.warning} />
              </View>
              <Text style={styles.logo}>{APP_CONFIG.name}</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleSearchPress}>
                <Ionicons name="search" size={22} color={APP_CONFIG.colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={22} color={APP_CONFIG.colors.text.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Enhanced CME Detection Card */}
          <Animated.View 
            style={[
              styles.cmeContainer,
              {
                transform: [{ scale: pulseAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.cmeLeft}>
              <View style={styles.cmeHeader}>
                <Ionicons name={liveData.cme_alert ? "warning" : "radio"} size={20} color={liveData.cme_alert ? APP_CONFIG.colors.error : APP_CONFIG.colors.success} />
                <Text style={[styles.cmeLabel, { color: liveData.cme_alert ? APP_CONFIG.colors.error : APP_CONFIG.colors.success }]}>
                  {liveData.cme_alert ? "CME ALERT ACTIVE" : "Quiet Solar Activity"}
                </Text>
              </View>
              <Text style={styles.cmeMainValue}>{liveData.cme_alert ? `Class ${liveData.cme_class}` : "No Threat"}</Text>
              <Text style={styles.cmeToday}>Probability: {(liveData.flare_probability * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.cmeRight}>
              <View style={styles.cmeProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${liveData.flare_probability * 100}%`, backgroundColor: liveData.cme_alert ? APP_CONFIG.colors.error : APP_CONFIG.colors.accent }]} />
                </View>
                <Text style={styles.cmePercentage}>{liveData.cme_class === 'None' ? 'NOMINAL' : liveData.cme_class}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Enhanced Mission Status Card */}
          <Animated.View 
            style={[
              styles.missionCard,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.missionHeader}>
              <View style={styles.missionIcon}>
                <Ionicons name="hardware-chip" size={20} color={APP_CONFIG.colors.info} />
              </View>
              <Text style={styles.missionTitle}>Aditya-L1 Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>OPERATIONAL</Text>
              </View>
            </View>
            <View style={styles.missionDetails}>
              <View style={styles.missionRow}>
                <Ionicons name="location" size={16} color={APP_CONFIG.colors.text.secondary} />
                <Text style={styles.missionLabel}>Position:</Text>
                <Text style={styles.missionValue}>L1 Lagrange Point</Text>
              </View>
              <View style={styles.missionRow}>
                <Ionicons name="resize" size={16} color={APP_CONFIG.colors.text.secondary} />
                <Text style={styles.missionLabel}>Distance:</Text>
                <Text style={styles.missionValue}>1.5M km from Earth</Text>
              </View>
              <View style={styles.missionRow}>
                <Ionicons name="time" size={16} color={APP_CONFIG.colors.text.secondary} />
                <Text style={styles.missionLabel}>Uptime:</Text>
                <Text style={styles.missionValue}>99.7% (342 days)</Text>
              </View>
            </View>
          </Animated.View>

          {/* Enhanced Solar Activity Alert */}
          <Animated.View 
            style={[
              styles.alertCard,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
             <View style={styles.alertHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                <Ionicons name="warning" size={24} color={APP_CONFIG.colors.warning} />
                <Text style={styles.alertTitle} numberOfLines={1} adjustsFontSizeToFit>SoLEXS/HEL1OS Alert</Text>
              </View>
              <View style={[
                styles.alertBadge, 
                { backgroundColor: liveData.alert_level === 'HIGH' ? APP_CONFIG.colors.error : (liveData.alert_level === 'MEDIUM' ? APP_CONFIG.colors.warning : APP_CONFIG.colors.success) + '30' }
              ]}>
                <Text style={[
                  styles.alertBadgeText,
                  { color: liveData.alert_level === 'HIGH' ? APP_CONFIG.colors.error : (liveData.alert_level === 'MEDIUM' ? APP_CONFIG.colors.warning : APP_CONFIG.colors.success) }
                ]}>{liveData.alert_level}</Text>
              </View>
            </View>

            <Text style={styles.alertText}>
              {liveData.alert_level} probability ({(liveData.flare_probability * 100).toFixed(1)}%) of solar flare.{"\n"}
              {liveData.alert_level === 'HIGH' ? (
                <Text style={{ fontSize: 14, color: APP_CONFIG.colors.error, fontWeight: 'bold' }}>X-ray flux anomalies detected.</Text>
              ) : (
                <Text style={{ fontSize: 11, color: APP_CONFIG.colors.text.tertiary }}>Nominal SoLEXS/HEL1OS flux.</Text>
              )}
            </Text>

            <View style={styles.alertFooter}>
              <View style={styles.alertTimeContainer}>
                <Ionicons name="time-outline" size={14} color={APP_CONFIG.colors.text.secondary} />
                <Text style={styles.alertTime}>Powered by: {liveData.method}</Text>
              </View>
              <TouchableOpacity style={styles.alertButton}>
                <Text style={styles.alertButtonText}>View Details</Text>
                <Ionicons name="arrow-forward" size={14} color={APP_CONFIG.colors.secondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Live Light Curve Image View */}
          <Animated.View style={[{
            backgroundColor: APP_CONFIG.colors.secondary,
            borderRadius: APP_CONFIG.borderRadius.xl,
            marginBottom: APP_CONFIG.spacing.lg,
            width: '100%',
            overflow: 'hidden',
            ...APP_CONFIG.shadows.medium,
          }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.cardHeader, { padding: 16, marginBottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={[styles.cardTitle, { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }]}>SSR Telemetry Stream</Text>
              <View style={{ backgroundColor: APP_CONFIG.colors.overlay.medium, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0, 198, 255, 0.3)' }}>
                <Text style={{ color: APP_CONFIG.colors.accent, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sync: {countdown}s</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setGraphModalVisible(true)} style={{ width: '100%', height: 260, backgroundColor: '#000000', justifyContent: 'center' }}>
              <Image 
                key={lightcurveUrl}
                source={{ uri: lightcurveUrl }} 
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Enhanced Action Buttons */}
          <Animated.View 
            style={[
              styles.actions,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <TouchableOpacity style={styles.primaryBtn} onPress={handleTelemetryPress}>
              <View style={styles.btnContent}>
                <Ionicons name="pulse" size={20} color={APP_CONFIG.colors.secondary} />
                <Text style={styles.primaryBtnText}>View Telemetry</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Enhanced Sensor Cards */}
          <View style={styles.rowHeader}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics" size={20} color={APP_CONFIG.colors.info} />
              <Text style={styles.subHeading}>Aditya-L1 Secondary Payloads</Text>
            </View>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAll}>View all</Text>
              <Ionicons name="chevron-forward" size={16} color={APP_CONFIG.colors.info} />
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={dynamicSensors}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: APP_CONFIG.spacing.lg }}
            renderItem={renderSensorCard}
          />

          {/* Enhanced Trending Solar Activity */}
          <View style={[styles.rowHeader, { marginTop: APP_CONFIG.spacing.xl }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={20} color={APP_CONFIG.colors.success} />
              <Text style={styles.subHeading}>X-ray Flux Trend</Text>
            </View>
          </View>
          {liveData.trending?.map(renderTrendingItem)}

          {/* Enhanced Footer */}
          <Animated.View 
            style={[
              styles.footerCard,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.footerContent}>
              <Ionicons name="shield-checkmark" size={20} color={APP_CONFIG.colors.success} />
              <Text style={styles.footerText}>On-Call Command Pager | Aditya-L1</Text>
            </View>
          </Animated.View>
        </ScrollView>
        
        {/* Floating Navbar */}
        <FloatingNavbar activeTab="home" onTabPress={handleTabPress} />
      </SafeAreaView>

      {/* Full-Screen Zoomable Graph Modal */}
      <Modal visible={isGraphModalVisible} transparent={true} animationType="fade" onRequestClose={() => setGraphModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}
            onPress={() => setGraphModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <ScrollView 
            maximumZoomScale={5} 
            minimumZoomScale={1} 
            bouncesZoom={true} 
            showsHorizontalScrollIndicator={false} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            style={{ width: '100%', height: '100%' }}
          >
            <Image 
              key={lightcurveUrl + '_modal'}
              source={{ uri: lightcurveUrl }} 
              style={{ width: screenWidth, height: screenWidth * 0.8, resizeMode: 'contain' }}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Dynamic Telemetry Modal */}
      <Modal visible={isTelemetryModalVisible} transparent={true} animationType="slide" onRequestClose={() => setTelemetryModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: APP_CONFIG.colors.secondary, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: 300 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>ISRO L1 Telemetry</Text>
              <TouchableOpacity onPress={() => setTelemetryModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={APP_CONFIG.colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={{ marginBottom: 15 }}>
              <Text style={{ color: APP_CONFIG.colors.text.secondary, fontSize: 14 }}>Backend Engine</Text>
              <Text style={{ color: APP_CONFIG.colors.accent, fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>FastAPI + PyTorch LSTM</Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ color: APP_CONFIG.colors.text.secondary, fontSize: 14 }}>Live Data Source</Text>
              <Text style={{ color: APP_CONFIG.colors.success, fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>NOAA GOES-16 X-Ray Flux</Text>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={{ color: APP_CONFIG.colors.text.secondary, fontSize: 14 }}>Threat Inference Model</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>Confidence Level: {(liveData.flare_probability * 100).toFixed(1)}%</Text>
            </View>
            
            <View style={{ padding: 12, backgroundColor: 'rgba(0, 198, 255, 0.1)', borderRadius: 8, marginTop: 10 }}>
              <Text style={{ color: APP_CONFIG.colors.accent, fontSize: 12, textAlign: 'center' }}>System functioning nominally. Digital twin simulators active.</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Emergency Alert Modal (Automated based on live data) */}
      <Modal visible={(liveData.cme_alert || liveData.alert_level === 'HIGH') && !hasAcknowledgedAlert} animationType="fade" transparent={true} onRequestClose={() => setHasAcknowledgedAlert(true)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(255, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a0000', padding: 30, borderRadius: 20, borderWidth: 2, borderColor: '#ff0000', alignItems: 'center', width: '100%', ...APP_CONFIG.shadows.heavy }}>
            <Ionicons name="warning" size={80} color="#ff3333" />
            <Text style={{ color: '#ff3333', fontSize: 26, fontWeight: 'bold', marginTop: 15, textAlign: 'center' }}>CRITICAL ALERT</Text>
            <Text style={{ color: '#ffffff', fontSize: 18, marginTop: 15, fontWeight: 'bold' }}>{liveData.cme_class !== 'None' ? `${liveData.cme_class} Solar Flare Forecasted` : 'Solar Flare Forecasted'}</Text>
            
            <View style={{ width: '100%', marginVertical: 20, padding: 15, backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: 10 }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 16, marginBottom: 8 }}>Confidence: <Text style={{ color: '#ff3333', fontWeight: 'bold' }}>{(liveData.flare_probability * 100).toFixed(1)}%</Text></Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 16, marginBottom: 8 }}>Primary Instrument: <Text style={{ color: '#fff', fontWeight: 'bold' }}>HEL1OS</Text></Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 16 }}>Impact Window: <Text style={{ color: '#fff', fontWeight: 'bold' }}>T-Minus 14m</Text></Text>
            </View>

            <TouchableOpacity 
              style={{ marginTop: 10, backgroundColor: '#ff0000', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, width: '100%' }}
              onPress={() => setHasAcknowledgedAlert(true)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>ACKNOWLEDGE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ParticleBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  blurTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.overlay.dark,
  },
  scrollContent: {
    paddingTop: APP_CONFIG.spacing.sm,
    paddingHorizontal: APP_CONFIG.spacing.lg,
    paddingBottom: 100, // Extra padding so floating navbar doesn't cover content
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: APP_CONFIG.spacing.xl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    backgroundColor: APP_CONFIG.colors.overlay.light,
    padding: APP_CONFIG.spacing.xs,
    borderRadius: APP_CONFIG.borderRadius.sm,
    marginRight: APP_CONFIG.spacing.sm,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text.primary,
    fontFamily: 'System',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: APP_CONFIG.spacing.md,
    padding: APP_CONFIG.spacing.xs,
    borderRadius: APP_CONFIG.borderRadius.sm,
    backgroundColor: APP_CONFIG.colors.secondary,
    ...APP_CONFIG.shadows.light,
  },
  cmeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: APP_CONFIG.colors.secondary,
    padding: APP_CONFIG.spacing.md,
    borderRadius: APP_CONFIG.borderRadius.xl,
    marginBottom: APP_CONFIG.spacing.lg,
    ...APP_CONFIG.shadows.medium,
  },
  cmeLeft: { flex: 3 },
  cmeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: APP_CONFIG.spacing.xs,
  },
  cmeLabel: {
    fontSize: 14,
    color: APP_CONFIG.colors.text.secondary,
    marginLeft: APP_CONFIG.spacing.xs,
  },
  cmeMainValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text.primary,
    marginBottom: APP_CONFIG.spacing.xs,
  },
  cmeToday: {
    fontSize: 14,
    color: APP_CONFIG.colors.text.tertiary,
  },
  cmeRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cmeProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: APP_CONFIG.colors.overlay.dark,
    borderRadius: 2,
    marginBottom: APP_CONFIG.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: APP_CONFIG.colors.success,
    borderRadius: 2,
  },
  cmePercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.success,
  },
  actions: {
    flexDirection: 'row',
    marginBottom: APP_CONFIG.spacing.xl,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: APP_CONFIG.colors.text.primary,
    paddingVertical: 16,
    borderRadius: APP_CONFIG.borderRadius.xl,
    marginRight: APP_CONFIG.spacing.sm,
    ...APP_CONFIG.shadows.medium,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: APP_CONFIG.colors.secondary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: APP_CONFIG.spacing.xs,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: APP_CONFIG.colors.text.primary,
    paddingVertical: 16,
    borderRadius: APP_CONFIG.borderRadius.xl,
    backgroundColor: APP_CONFIG.colors.secondary,
    ...APP_CONFIG.shadows.light,
  },
  outlineBtnText: {
    color: APP_CONFIG.colors.text.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: APP_CONFIG.spacing.xs,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: APP_CONFIG.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subHeading: {
    fontSize: 18,
    color: APP_CONFIG.colors.text.primary,
    fontWeight: '600',
    marginLeft: APP_CONFIG.spacing.sm,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAll: {
    color: APP_CONFIG.colors.info,
    fontSize: 14,
    marginRight: APP_CONFIG.spacing.xs,
  },
  card: {
    width: screenDimensions.width * 0.6,
    backgroundColor: APP_CONFIG.colors.secondary,
    padding: APP_CONFIG.spacing.md,
    borderRadius: APP_CONFIG.borderRadius.xl,
    marginRight: APP_CONFIG.spacing.md,
    ...APP_CONFIG.shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: APP_CONFIG.spacing.sm,
  },
  cardIconContainer: {
    backgroundColor: APP_CONFIG.colors.overlay.light,
    padding: APP_CONFIG.spacing.xs,
    borderRadius: APP_CONFIG.borderRadius.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text.primary,
  },
  cardSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text.primary,
  },
  cardName: {
    fontSize: 12,
    color: APP_CONFIG.colors.text.secondary,
    marginBottom: APP_CONFIG.spacing.sm,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_CONFIG.colors.text.primary,
  },
  cardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: APP_CONFIG.spacing.xs,
  },
  cardTrendText: {
    marginLeft: APP_CONFIG.spacing.xs,
    fontSize: 14,
  },
  graphImage: {
    width: '100%',
    height: 60,
    resizeMode: 'contain',
    marginTop: APP_CONFIG.spacing.sm,
  },
  trendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: APP_CONFIG.spacing.sm,
    borderBottomColor: APP_CONFIG.colors.overlay.dark,
    borderBottomWidth: 1,
  },
  trendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingIcon: {
    backgroundColor: APP_CONFIG.colors.overlay.light,
    padding: APP_CONFIG.spacing.xs,
    borderRadius: APP_CONFIG.borderRadius.sm,
    marginRight: APP_CONFIG.spacing.sm,
  },
  trendingName: {
    color: APP_CONFIG.colors.text.primary,
    fontSize: 16,
  },
  trendingChange: {
    fontSize: 16,
    marginLeft: APP_CONFIG.spacing.xs,
  },
  footerCard: {
    backgroundColor: APP_CONFIG.colors.secondary,
    padding: APP_CONFIG.spacing.md,
    marginTop: APP_CONFIG.spacing.lg,
    borderRadius: APP_CONFIG.borderRadius.xl,
    ...APP_CONFIG.shadows.light,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: APP_CONFIG.colors.text.secondary,
    fontSize: 13,
    textAlign: 'center',
    marginLeft: APP_CONFIG.spacing.sm,
  },
  missionCard: {
    backgroundColor: APP_CONFIG.colors.secondary,
    padding: APP_CONFIG.spacing.md,
    borderRadius: APP_CONFIG.borderRadius.xl,
    marginBottom: APP_CONFIG.spacing.lg,
    ...APP_CONFIG.shadows.medium,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: APP_CONFIG.spacing.sm,
  },
  missionIcon: {
    backgroundColor: APP_CONFIG.colors.overlay.light,
    padding: APP_CONFIG.spacing.xs,
    borderRadius: APP_CONFIG.borderRadius.sm,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_CONFIG.colors.text.primary,
    marginLeft: APP_CONFIG.spacing.sm,
  },
  statusBadge: {
    backgroundColor: APP_CONFIG.colors.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: APP_CONFIG.spacing.sm,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.success + '50',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: APP_CONFIG.colors.success,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.success,
  },
  missionDetails: {
    marginTop: APP_CONFIG.spacing.sm,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: APP_CONFIG.spacing.xs,
  },
  missionLabel: {
    fontSize: 14,
    color: APP_CONFIG.colors.text.secondary,
    marginLeft: APP_CONFIG.spacing.xs,
    marginRight: APP_CONFIG.spacing.sm,
  },
  missionValue: {
    fontSize: 14,
    color: APP_CONFIG.colors.text.primary,
    flex: 1,
  },
  alertCard: {
    backgroundColor: APP_CONFIG.colors.secondary,
    padding: APP_CONFIG.spacing.md,
    borderRadius: APP_CONFIG.borderRadius.xl,
    marginBottom: APP_CONFIG.spacing.lg,
    ...APP_CONFIG.shadows.medium,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: APP_CONFIG.spacing.sm,
  },
  alertIcon: {
    backgroundColor: APP_CONFIG.colors.overlay.light,
    padding: APP_CONFIG.spacing.xs,
    borderRadius: APP_CONFIG.borderRadius.sm,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP_CONFIG.colors.text.primary,
    marginLeft: APP_CONFIG.spacing.sm,
    flex: 1,
  },
  alertBadge: {
    backgroundColor: APP_CONFIG.colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: APP_CONFIG.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.secondary,
  },
  alertText: {
    fontSize: 14,
    color: APP_CONFIG.colors.text.secondary,
    marginBottom: APP_CONFIG.spacing.sm,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 10,
  },
  alertTime: {
    fontSize: 14,
    color: APP_CONFIG.colors.text.tertiary,
    marginLeft: APP_CONFIG.spacing.xs,
    flexShrink: 1,
  },
  alertButton: {
    backgroundColor: APP_CONFIG.colors.text.primary,
    padding: APP_CONFIG.spacing.xs,
    borderRadius: APP_CONFIG.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertButtonText: {
    color: APP_CONFIG.colors.secondary,
    fontWeight: 'bold',
    marginRight: APP_CONFIG.spacing.xs,
  },
});