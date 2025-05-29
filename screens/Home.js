import debounce from 'lodash.debounce';
import Filters from '../components/Filters';
import { Searchbar } from 'react-native-paper';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getSectionListData, useUpdateEffect } from '../utils/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTable, getMenuItems, saveMenuItems, filterByQueryAndCategories } from '../database';
import { Text, View, StyleSheet, SectionList, SafeAreaView, Alert, Image, Pressable } from 'react-native';

const sections = ['starters', 'mains', 'desserts'];
const API_URL ='https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json';

const Item = ({ name, price, description, image }) => (
    <View style={styles.item}>
        <View style={styles.itemBody}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.description}>{description}</Text>
            <Text style={styles.price}>${price}</Text>
        </View>
        <Image style={styles.itemImage} source={{uri: `https://github.com/Meta-Mobile-Developer-PC/Working-With-Data-API/blob/main/images/${image}?raw=true`}}/>
    </View>
);

const Home = ({navigation}) => {
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        orderStatuses: false,
        passwordChanges: false,
        specialOffers: false,
        newsletter: false,
        image: "",
    });

    const [data, setData] = useState([]);
    const [query, setQuery] = useState('');
    const [searchBarText, setSearchBarText] = useState('');
    const [filterSelections, setFilterSelections] = useState(
      sections.map(() => false)
    );

    const fetchData = async() => {
        try {
            const response = await fetch(API_URL);
            const json = await response.json();

            return json.menu.map((item, index) => ({
              id: index+1,
              name: item.name,
              price: item.price.toString(),
              description: item.description,
              image: item.image,
              category: item.category
            }));
        } catch (error) {
            console.error(error);
        }
    }

    const fetchFilteredData = useCallback(async () => {
        const activeCategories = sections.filter((_, i) =>
          filterSelections.every(f => !f) ? true : filterSelections[i]
        );

        try {
          const items = await filterByQueryAndCategories(query, activeCategories);
          setData(getSectionListData(items));
        } catch (e) {
          Alert.alert(e.message);
        }
    }, [query, filterSelections, setData]);

    useUpdateEffect(() => {
      fetchFilteredData();
    }, [fetchFilteredData]);

    useEffect(() => {
      const loadInitialData = async () => {
        try {
          await createTable();

          let items = await getMenuItems();
          if (items.length === 0) {
            items = await fetchData();
            saveMenuItems(items);
          }

          setData(getSectionListData(items));

          const rawProfile = await AsyncStorage.getItem('profile');
          setProfile(JSON.parse(rawProfile));
        } catch (e) {
          Alert.alert(e.message);
        }
      };

      loadInitialData();
    }, []);

    const lookup = useCallback(q => {
      setQuery(q);
    }, []);

    const debouncedLookup = useMemo(
      () => debounce(lookup, 500),
      [lookup]
    );

    const handleSearchChange = useCallback(text => {
        setSearchBarText(text);
        debouncedLookup(text);
    }, [debouncedLookup]);

    const handleFiltersChange = useCallback(index => {
        setFilterSelections(prev =>
            prev.map((val, i) => (i === index ? !val : val))
        );
    }, []);

    return (
      <SafeAreaView style={styles.container}>
          <View style={styles.header}>
              <Image style={styles.logo} source={require("../img/littleLemonLogo.png")} accessible={true} accessibilityLabel={"Little Lemon Logo"} />
              <Pressable style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
                  {profile.image ? <Image source={{ uri: profile.image }} style={styles.avatarImage} /> : <View style={styles.avatarEmpty}><Text style={styles.avatarEmptyText}>{profile.firstName && Array.from(profile.firstName)[0]}{profile.lastName && Array.from(profile.lastName)[0]}</Text></View>}
              </Pressable>
          </View>
        <View style={styles.heroSection}>
            <Text style={styles.heroHeader}>Little Lemon</Text>
            <View style={styles.heroBody}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroHeader2}>Chicago</Text>
                    <Text style={styles.heroText}>We are a family owned Mediterranean restaurant, focused on traditional recipes served with a modern twist.</Text>
                </View>
                <Image style={styles.heroImage} source={require("../img/restauranfood.png")} accessible={true} accessibilityLabel={"Little Lemon Food"} />
            </View>
            <Searchbar placeholder="Search" placeholderTextColor="#333333" onChangeText={handleSearchChange}
                value={searchBarText} style={styles.searchBar} iconColor="#333333" inputStyle={{ color: '#333333' }} elevation={0} />
          </View>
          <Text style={styles.delivery}>ORDER FOR DELIVERY!</Text>
          <Filters selections={filterSelections} onChange={handleFiltersChange} sections={sections} />
          <SectionList 
              style={styles.sectionList} sections={data} keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Item name={item.name} price={item.price} description={item.description} image={item.image} />
              )}
              renderSectionHeader={({ section: { name } }) => (
                <Text style={styles.itemHeader}>{name}</Text>
              )}
          />
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#dee3e9",
  },
  logo: {
    height: 50,
    width: 150,
    resizeMode: "contain",
  },
  sectionList: {
    paddingHorizontal: 16,
  },
  searchBar: {
    marginTop: 15,
    backgroundColor: '#e4e4e4',
    shadowRadius: 0,
    shadowOpacity: 0,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    paddingVertical: 10,
  },
  itemBody: {
    flex: 1,
  },
  itemHeader: {
    fontSize: 24,
    paddingVertical: 8,
    color: '#495e57',
    backgroundColor: '#fff'
  },
  name: {
    fontSize: 20,
    color: '#000000',
    paddingBottom: 5,
  },
  description: {
    color: '#495e57',
    paddingRight: 5,
  },
  price: {
    fontSize: 20,
    color: '#495e57',
    paddingTop: 5,
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  avatar: {
    flex: 1,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarEmpty: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0b9a6a',
    alignItems: "center",
    justifyContent: "center",
  },
  heroSection: {
    backgroundColor: '#495e57',
    padding: 15,
  },
  heroHeader: {
    color: '#f4ce14',
    fontWeight: 'bold',
    fontSize: 36,
  },
  heroHeader2: {
    color: '#fff',
    fontSize: 24,
  },
  heroText: {
    color: '#fff'
  },
  heroBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroContent: {
    flex: 1,
  },
  heroImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  delivery: {
    fontSize: 22,
    fontWeight: 'bold',
    padding: 15,
  }
});

export default Home;