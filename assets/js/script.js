// global variables needed
var statesDict = {};
var pickedState = false;
var pickedCity = false;
var inputLat = '';
var inputLon = '';

// retrieve search history
var searchHistoryArr = JSON.parse(localStorage.getItem('searchHistoryArr')) || [];

// get reference to the table body and the buttons
var statesEl = document.querySelector('#states');
var citiesEl = document.querySelector('#cities');
var covidStatsEl = document.querySelector('#covid-stats');
var searchHistoryEl = document.querySelector('#searchHistory');
var filterButton = document.querySelector('#subBtn');
var clearButton = document.querySelector('#clearBtn');

// utility function to display list of unique values
var uniqueValues = ((value, index, self) => self.indexOf(value) === index);

// get data from COVID api
var makeDropDownLists = () => {
    fetch("https://covid-19-statistics.p.rapidapi.com/reports?iso=USA", {
	    "method": "GET",
	    "headers": {
		    "x-rapidapi-host": "covid-19-statistics.p.rapidapi.com",
		    "x-rapidapi-key": "0963280af0msh0e5fedbfcf26176p193969jsndbe28f1cd420"
	    }
    })
    .then(response => response.json())
    .then(res => makeStatesDropDownList(res.data))
    .catch(err => console.log(err));
};

// prepare drop-down list for states
var makeStatesDropDownList = (data) => {
    statesEl.innerHTML = '<option selected="selected" value="all">All states</option>';
    // append each state into the drop-down selection list
    data.forEach(item => {
        getCities(item.region.province, item.region.cities);
        var optionEl = document.createElement('option');
        optionEl.value = item.region.province;
        optionEl.textContent = item.region.province;
        statesEl.appendChild(optionEl);
    });
    makeCitiesDropDownList('all');
};

// prepare drop-down list for cities
var makeCitiesDropDownList = (state) => {
    var citiesToDisplay = [];
    if (state === 'all') {
        Object.values(statesDict).forEach(citiesArray => {
            citiesArray.forEach(city => citiesToDisplay.push(city));
        });
        citiesToDisplay = citiesToDisplay.filter(uniqueValues).sort();
    } else {
        citiesEl.innerHTML = '';
        citiesToDisplay = statesDict[state];
    }

    // append each city into the drop-down selection list
    citiesEl.innerHTML = '<option selected="selected" value="all">All cities</option>';
    citiesToDisplay.forEach(city => {
        var optionEl = document.createElement('option');
        optionEl.value = city;
        optionEl.textContent = city;
        citiesEl.appendChild(optionEl);
    });
};

// extract cities from a particular state and store in citiesList
var getCities = (state, cities) => {
    var citiesList = [];
    cities.forEach(city => citiesList.push(city.name));
    statesDict[state] = citiesList.sort();
};

// find state(s) for a selected city
var identifyState = (citySelected) => {
    var statesList = [];
    Object.entries(statesDict).forEach(entry => {
        entry[1].forEach(city => {
            if (city === citySelected) {
                statesList.push(entry[0]);
            }
        });
    });
    return statesList;
};

// function to narrow drop down list of cities upon selection of a state
var stateSelectionHandler = (event) => {
    event.preventDefault();
    pickedState = true;
    // get value from selected element
    var selectedState = statesEl.options[statesEl.selectedIndex].value;
    // adjust drop down for cities only if user had not already selected a city
    if (!pickedCity) {
        makeCitiesDropDownList(selectedState);
    }
};

// function to narrow drop down list of cities upon selection of a state
var citySelectionHandler = (event) => {
    event.preventDefault();
    pickedCity = true;
    // get value from selected element
    var selectedCity = citiesEl.options[citiesEl.selectedIndex].value;
    // adjust drop down for states only if user had not already selected a state
    if (!pickedState) {
        var correspondingStatesArr = identifyState(selectedCity);
        statesEl.innerHTML = '';
        correspondingStatesArr.forEach(state => {
            var optionEl = document.createElement('option');
            optionEl.value = state;
            optionEl.textContent = state;
            statesEl.appendChild(optionEl);
        });
    }
};

// function to fetch covid data based on user selections (assuming we have only one city/state pair selected)
var searchClickHandler = (event) => {
    event.preventDefault();
    // grab the user's filters
    var inputState = statesEl.options[statesEl.selectedIndex].value;
    var inputCity = citiesEl.options[citiesEl.selectedIndex].value;
    fetchCovidData(inputCity, inputState);
    // display city and state in search history if not already there
    var inSearchHistory = false;
    searchHistoryArr.forEach(obj => {
        if (obj.city === inputCity && obj.state === inputState) {
            return inThere = true;
        }
    });
    if (!inSearchHistory) {
        var newObj = {              // create new city/state pair
            city: inputCity,
            state: inputState
        }
        searchHistoryArr.push(newObj); // add new city/state pair
        localStorage.setItem('searchHistoryArr', JSON.stringify(searchHistoryArr)); // save updated array
        searchHistory();   // display updated search history
    }
};

// function to fetch covid data for selected city/state pair
var fetchCovidData = (inputCity, inputState) => {
    fetch(`https://covid-19-statistics.p.rapidapi.com/reports?iso=USA&region_province=${inputState}&city_name=${inputCity}`, {
	    "method": "GET",
	    "headers": {
		    "x-rapidapi-host": "covid-19-statistics.p.rapidapi.com",
		    "x-rapidapi-key": "0963280af0msh0e5fedbfcf26176p193969jsndbe28f1cd420"
	    }
    })
    .then(response => response.json())
    .then(res => displayCovidStats(res.data[0]))
    .catch(err => console.log(err));
};

// function to display covid stats fectched from covid api (only one city/state pair mvp)
var displayCovidStats = (dataObj) => {
    // clear old content
    covidStatsEl.innerHTML = '';
    // extract lat and lon for maps purposes
    inputLat = dataObj.region.cities[0].lat;
    inputLon = dataObj.region.cities[0].long;
    // display date
    var dateEl = document.createElement('li');
    dateEl.textContent = `As of: ${dataObj.region.cities[0].date}`;
    covidStatsEl.appendChild(dateEl);
    // display confirmed cases and diff cases
    var confirmedCasesEl = document.createElement('li');
    if (parseInt(dataObj.region.cities[0].confirmed_diff) > 0) {
        confirmedCasesEl.textContent = `Confirmed cases: ${dataObj.region.cities[0].confirmed} (+${dataObj.region.cities[0].confirmed_diff} cases compared to the previous day)`;
    }
    else if (parseInt(dataObj.region.cities[0].confirmed_diff) === 0) {
        confirmedCasesEl.textContent = `Confirmed cases: ${dataObj.region.cities[0].confirmed} (no new cases compared to the previous day)`;
    }
    else {
        confirmedCasesEl.textContent = `Confirmed cases: ${dataObj.region.cities[0].confirmed} (${dataObj.region.cities[0].confirmed_diff} cases compared to the previous day)`;
    }
    covidStatsEl.appendChild(confirmedCasesEl);
    // display deaths and diff deaths
    var deathsEl = document.createElement('li');
    if (parseInt(dataObj.region.cities[0].deaths_diff) > 0) {
        deathsEl.textContent = `Deaths: ${dataObj.region.cities[0].deaths} (+${dataObj.region.cities[0].deaths_diff} deaths compared to the previous day)`;
    }
    else if (parseInt(dataObj.region.cities[0].deaths_diff) === 0) {
        deathsEl.textContent = `Deaths: ${dataObj.region.cities[0].deaths} (no new deaths compared to the previous day)`;
    }
    else {
        deathsEl.textContent = `Deaths: ${dataObj.region.cities[0].deaths} (${dataObj.region.cities[0].deaths_diff} deaths compared to the previous day)`;
    }
    covidStatsEl.appendChild(deathsEl);
    // display date
    var fatalityRateEl = document.createElement('li');
    fatalityRateEl.textContent = `Fatality rate in ${dataObj.region.province}: ${dataObj.fatality_rate}`;
    covidStatsEl.appendChild(fatalityRateEl);
};

// function to populate the search history and save to local storage
var searchHistory = () => {
    // clear previous search history
    searchHistoryEl.innerHTML = '';
    // loop through searchHistoryArr to display user search history
    searchHistoryArr.forEach(obj => {
        var cityStateEl = document.createElement('li');
        cityStateEl.setAttribute('class', 'list-group-item');
        cityStateEl.textContent = `${obj.city}, ${obj.state}`;
        searchHistoryEl.appendChild(cityStateEl);
    });
};

// function to reset drop down lists
var clearFilters = (event) => {
    pickedState = false;
    pickedCity = false;
    statesEl.innerHTML = '';
    citiesEl.innerHTML = '';
    makeDropDownLists();
};

// function to handle click on a city/state pair displayed in the search history
var searchHistoryClickHandler = event => {
    var cityState = event.target.textContent;
    var inputCity = cityState.split(', ')[0];
    var inputState = cityState.split(', ')[1];
    fetchCovidData(inputCity, inputState);
}

// function to clear the search history
var clearSearchHistory = () => {
    searchHistoryArr = [];
    localStorage.setItem('searchHistoryArr', JSON.stringify(searchHistoryArr));
    searchHistory();
};

// event listeners
statesEl.addEventListener('change', stateSelectionHandler);
citiesEl.addEventListener('change', citySelectionHandler);
filterButton.addEventListener('click', searchClickHandler);
clearButton.addEventListener('click', clearFilters);
searchHistoryEl.addEventListener('click', searchHistoryClickHandler);
delHistory.addEventListener('click', clearSearchHistory);

// prepare drop down lists and display search history stored in local storage upon opening the app
makeDropDownLists();
searchHistory();