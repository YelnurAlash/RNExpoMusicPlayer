import { View, Text, StyleSheet, Pressable, Dimensions, FlatList, Image } from 'react-native'
import React, {useState, useEffect, useRef} from 'react'
import songs from '../../model/data';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import {play} from '../features/audioControllers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');

const Player = () => {
  const ref = useRef(null);
  const [songIndex, setSongIndex] = useState(0);
  const [soundObj, setSoundObj] = useState(null);
  const [position, setPosition] = useState(null);
  const [duration, setDuration] = useState(null);
  const [favorite, setFavorite] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const getFavoriteSongs = async () => {
    try {
      await AsyncStorage.getItem('FavoriteSongs')
        .then(value => {
          if (value !== null) {
            value = JSON.parse(value);
            setFavorites(() => [...value])
            
          }
        })
    } catch (error) {
      console.log(error);
    }
  }

  const setData = async () => {
    try {
      await AsyncStorage.setItem('FavoriteSongs', JSON.stringify(favorites));
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getFavoriteSongs();
  }, []);

  const changeFavoriteState = () => {
    if (favorites.includes(songIndex)) {
      setFavorite(true)
    } else {
      setFavorite(false)
    }
  }

  useEffect(() => {
    changeFavoriteState();

    setData();
  }, [favorites]);

  const handleFavorite = async () => {
    if (favorite) {
      setFavorites(() => favorites.filter(el => el !== songIndex));
    } else {
      setFavorites(previousFavorites => [...previousFavorites, songIndex]);
    }
  }

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded && status.isPlaying) {
      setPosition(status.positionMillis)
      setDuration(status.durationMillis)
    }

    if (status.didJustFinish) {
      if (songIndex === songs.length - 1) return;
      setSongIndex(songIndex + 1)
    }
  };

  const calculateProgressBar = () => {
    if (position !== null && duration !== null) {
      return position / duration;
    }

    return 0;
  }

  const handleMusic = async (audio) => {
      if (soundObj === null) {
        play(audio, setSoundObj, onPlaybackStatusUpdate);
      }

      if (soundObj?.status.isLoaded && soundObj?.status.isPlaying) {
        const status = await soundObj.playbackObj.pauseAsync();
        setSoundObj({...soundObj, status})
      }

      if (soundObj?.status.isLoaded && !soundObj?.status.isPlaying && soundObj?.currentAudio.id === audio?.id) {
        const status = await soundObj.playbackObj.playAsync()
        setSoundObj({...soundObj, status})
      }
  }

  const stopMusicOnScroll = async () => {
    await soundObj.playbackObj.stopAsync();
    await soundObj.playbackObj.unloadAsync();
    setPosition(null);
    setDuration(null);
    setSoundObj(null);
  }

  useEffect(() => {
    ref.current?.scrollToIndex({
      animated: true, 
      index: songIndex
    });

    changeFavoriteState();

    if (soundObj !== null && soundObj.status.isPlaying) {
      stopMusicOnScroll().then(() => {
        play(songs[songIndex], setSoundObj, onPlaybackStatusUpdate);
      })
    }

    if (soundObj !== null && !soundObj.status.isPlaying) {
      stopMusicOnScroll()
    }
  }, [songIndex])

  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        <FlatList
          ref={ref}
          initialScrollIndex={songIndex}
          data={songs}
          renderItem={({item}) => (
            <View style={styles.imageContainer}>
              <Image style={styles.image} source={item.artwork} />
            </View>
          )}
          onMomentumScrollEnd={event => {
            const index = Math.floor(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width)

            setSongIndex(index);
          }}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
         />
         <View style={styles.songDataContainer}>
            <View>
              <Text style={styles.title}>{songs[songIndex].title}</Text>
              <Text style={styles.artist}>{songs[songIndex].artist}</Text>
            </View>
            <Pressable onPress={handleFavorite}>
              <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={30} color='#00FFFF' />
            </Pressable>
         </View>
         <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={calculateProgressBar()}
            thumbTintColor="#00FFFF"
            minimumTrackTintColor="#00FFFF"
            maximumTrackTintColor="#FFFFFF"
          />
          <View style={styles.durationContainer}>
            <Text style={styles.duration}>{new Date(position).toISOString().slice(14, 19)}</Text>
            <Text style={styles.duration}>{songs[songIndex].duration}</Text>
          </View>
      </View>
      <View style={styles.bottomContainer}>
        <Pressable onPress={() => {
          if (songIndex === 0) return;

          setSongIndex(songIndex - 1);
        }}>
            <Ionicons name='play-skip-back-outline' size={30} color='#00FFFF' />
        </Pressable>
        <Pressable onPress={() => handleMusic(songs[songIndex])}>
            <Ionicons name={soundObj?.status?.isPlaying ? 'ios-pause-circle' : 'ios-play-circle'} size={70} color='#00FFFF' />
        </Pressable>
        <Pressable onPress={() => {
          if (songIndex === songs.length - 1) return;

          setSongIndex(songIndex + 1);
        }}>
            <Ionicons name='play-skip-forward-outline' size={30} color='#00FFFF' />
        </Pressable>
      </View>
    </View>
  )
}

export default Player

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1
  },
  imageContainer: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 340,
    borderRadius: 20
  },
  songDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  title: {
    color: 'white'
  },
  artist: {
    color: 'gray'
  },
  slider: {
    width: width,
    height: 40
  },
  durationContainer: {
    width: width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10
  },
  duration: {
    color: 'white'
  },
  bottomContainer: {
    width: width,
    flexDirection: 'row',
    paddingHorizontal: 80,
    justifyContent: 'space-around',
    alignItems: 'center',
  }
})
