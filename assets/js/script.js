// global variables needed
var statesDict = {};
var pickedState = false;
var pickedCounty = false;
var inputLat = '';
var inputLon = '';

// get reference to the table body and the buttons
var statesEl = document.querySelector('#states');
var countiesEl = document.querySelector('#counties');
var covidStatsEl = document.querySelector('#covidStats');
var searchHistoryEl = document.querySelector('#searchHistory');
var filterButton = document.querySelector('#subBtn');
var clearButton = document.querySelector('#clearBtn');

// utility function to display list of unique values
var uniqueValues = ((value, index, self) => self.indexOf(value) === index);

// retrieve search history
var searchHistoryArr = JSON.parse(localStorage.getItem('searchHistoryArr')) || [];

// function to populate the search history and save to local storage
var searchHistory = () => {
    // clear previous search history
    searchHistoryEl.innerHTML = '';
    // loop through searchHistoryArr to display user search history
    searchHistoryArr.forEach(obj => {
        var countyStateEl = document.createElement('li');
        countyStateEl.setAttribute('class', 'list-group-item');
        countyStateEl.textContent = `${obj.county}, ${obj.state}`;
        searchHistoryEl.appendChild(countyStateEl);
    });
};
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
    data.forEach(obj => {
        getCounties(obj.region.province, obj.region.cities);
        var optionEl = document.createElement('option');
        optionEl.value = obj.region.province;
        optionEl.textContent = obj.region.province;
        statesEl.appendChild(optionEl);
    });
    makeCountiesDropDownList('all');
};

// extract counties from a particular state and store in countiesList
var getCounties = (state, counties) => {
    var countiesList = [];
    counties.forEach(county => {

        countiesList.push(county.name);
    });
    statesDict[state] = countiesList.sort();
};

// prepare drop-down list for counties
var makeCountiesDropDownList = (state) => {
    var countiesToDisplay = [];
    if (state === 'all') {
        Object.values(statesDict).forEach(countiesArray => {
            countiesArray.forEach(county => countiesToDisplay.push(county));
        });
        countiesToDisplay = countiesToDisplay.filter(uniqueValues).sort();
    } else {
        countiesEl.innerHTML = '';
        countiesToDisplay = statesDict[state];
    }

    // append each county into the drop-down selection list
    countiesEl.innerHTML = '<option selected="selected" value="all">All counties</option>';
    countiesToDisplay.forEach(county => {
        var optionEl = document.createElement('option');
        optionEl.value = county;
        optionEl.textContent = county;
        countiesEl.appendChild(optionEl);
    });
};

// find state(s) for a selected county
var identifyState = (countySelected) => {
    var statesList = [];
    Object.entries(statesDict).forEach(entry => {
        entry[1].forEach(county => {
            if (county === countySelected) {
                statesList.push(entry[0]);
            }
        });
    });
    return statesList;
};

// function to narrow drop down list of counties upon selection of a state
var stateSelectionHandler = (event) => {
    event.preventDefault();
    pickedState = true;
    // get value from selected element
    var selectedState = statesEl.options[statesEl.selectedIndex].value;
    // adjust drop down for counties only if user had not already selected a county
    if (!pickedCounty) {
        makeCountiesDropDownList(selectedState);
    }
};

// function to narrow drop down list of counties upon selection of a state
var countySelectionHandler = (event) => {
    event.preventDefault();
    pickedCounty = true;
    // get value from selected element
    var selectedCounty = countiesEl.options[countiesEl.selectedIndex].value;
    // adjust drop down for states only if user had not already selected a state
    if (!pickedState) {
        var correspondingStatesArr = identifyState(selectedCounty);
        statesEl.innerHTML = '';
        correspondingStatesArr.forEach(state => {
            var optionEl = document.createElement('option');
            optionEl.value = state;
            optionEl.textContent = state;
            statesEl.appendChild(optionEl);
        });
    }
};

// function to fetch covid data based on user selections (assuming we have only one county/state pair selected)
var searchClickHandler = (event) => {
    event.preventDefault();
    // grab the user's filters
    var inputState = statesEl.options[statesEl.selectedIndex].value;
    var inputCounty = countiesEl.options[countiesEl.selectedIndex].value;
    fetchCovidData(inputCounty, inputState);
    // display county and state in search history if not already there
    var inSearchHistory = false;
    searchHistoryArr.forEach(obj => {
        if (obj.county === inputCounty && obj.state === inputState) {
            return inThere = true;
        }
    });
    if (!inSearchHistory) {
        var newObj = {              // create new county/state pair
            county: inputCounty,
            state: inputState
        }
        searchHistoryArr.push(newObj); // add new county/state pair
        localStorage.setItem('searchHistoryArr', JSON.stringify(searchHistoryArr)); // save updated array
        searchHistory();   // display updated search history
    }
};

// function to fetch covid data for selected county/state pair
var fetchCovidData = (inputCounty, inputState) => {
    fetch(`https://covid-19-statistics.p.rapidapi.com/reports?iso=USA&region_province=${inputState}&city_name=${inputCounty}`, {
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

// function to display covid stats fectched from covid api (only one county/state pair mvp)
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

// function to reset drop down lists
var clearFilters = (event) => {
    pickedState = false;
    pickedCounty = false;
    statesEl.innerHTML = '';
    countiesEl.innerHTML = '';
    makeDropDownLists();
};

// function to handle click on a county/state pair displayed in the search history
var searchHistoryClickHandler = event => {
    var countyState = event.target.textContent;
    var inputCounty = countyState.split(', ')[0];
    var inputState = countyState.split(', ')[1];
    fetchCovidData(inputCounty, inputState);
}

// function to clear the search history
var clearSearchHistory = () => {
    searchHistoryArr = [];
    localStorage.setItem('searchHistoryArr', JSON.stringify(searchHistoryArr));
    searchHistory();
};

// event listeners
statesEl.addEventListener('change', stateSelectionHandler);
countiesEl.addEventListener('change', countySelectionHandler);
filterButton.addEventListener('click', searchClickHandler);
clearButton.addEventListener('click', clearFilters);
searchHistoryEl.addEventListener('click', searchHistoryClickHandler);
delHistory.addEventListener('click', clearSearchHistory);

// prepare drop down lists and display search history stored in local storage upon opening the app
makeDropDownLists();
searchHistory();