// global variables needed
var statesDict = {};
var pickedState = false;
var pickedCounty = false;
var inputLat = '';
var inputLon = '';
var plotData = [];

// get reference to the table body and the buttons
var statesEl = document.querySelector('#states');
var countiesEl = document.querySelector('#counties');
var searchHistoryEl = document.querySelector('#searchHistory');
var filterButton = document.querySelector('#subBtn');
var clearButton = document.querySelector('#clearBtn');
var plotEl = document.querySelector('#plot');
var iframeMapEl = document.querySelector('#iframeMap');

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
    counties.forEach(county => countiesList.push(county.name));
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
    fetchPlotData(inputCounty, inputState);
    fetch(`https://covid-19-statistics.p.rapidapi.com/reports?iso=USA&region_province=${inputState}&city_name=${inputCounty}`, {
	    "method": "GET",
	    "headers": {
		    "x-rapidapi-host": "covid-19-statistics.p.rapidapi.com",
		    "x-rapidapi-key": "0963280af0msh0e5fedbfcf26176p193969jsndbe28f1cd420"
	    }
    })
    .then(response => response.json())
    .then(res => displayCovidTable(res.data[0]))
    .catch(err => console.log(err));
};

/*/ function to display covid stats fectched from covid api (only one county/state pair mvp)
var displayCovidTable = (dataObj) => {
    // extract lat and lon for maps purposes
    inputLat = dataObj.region.cities[0].lat;
    inputLon = dataObj.region.cities[0].long;
    iframeMapEl.setAttribute('src', 'maps.html?lat='+ inputLat + '&lon=' + inputLon);
    // display location searched
    locationSearchedEl.textContent = `${dataObj.region.cities[0].name} county, ${dataObj.region.province}`;
    // display last update date
    lastUpdateEl.textContent = `Last update: ${dataObj.region.cities[0].date}`;
    // ppopulate table
    countyThEl.textContent = dataObj.region.cities[0].name;
    stateThEl.textContent = dataObj.region.province;
    tbRow1El.textContent = '# cases';
    tbRow2El.textContent = 'Δ cases';
    tbRow3El.textContent = '# deaths';
    tbRow4El.textContent = 'Δ deaths';
    tbRow5El.textContent = 'Fatality rate';
    // county data
    tbRow1CountyEl.textContent = dataObj.region.cities[0].confirmed;
    var countyCasesDiff = dataObj.region.cities[0].confirmed_diff;
    tbRow2CountyEl.textContent = countyCasesDiff;
    if (parseInt(countyCasesDiff) > 0) {
        tbRow1CountyEl.setAttribute('class', 'more');
        tbRow2CountyEl.setAttribute('class', 'more');
    }
    else if (parseInt(countyCasesDiff) === 0) {
        tbRow1CountyEl.setAttribute('class', 'same');
        tbRow2CountyEl.setAttribute('class', 'same');
    }
    else {
        tbRow1CountyEl.setAttribute('class', 'less');
        tbRow2CountyEl.setAttribute('class', 'less');
    }
    tbRow3CountyEl.textContent = dataObj.region.cities[0].deaths;
    var countyDeathsDiff = parseInt(dataObj.region.cities[0].deaths_diff);
    tbRow4CountyEl.textContent = countyDeathsDiff;
    if (countyDeathsDiff > 0) {
        tbRow3CountyEl.setAttribute('class', 'more');
        tbRow4CountyEl.setAttribute('class', 'more');
    }
    else if (countyDeathsDiff === 0) {
        tbRow3CountyEl.setAttribute('class', 'same');
        tbRow4CountyEl.setAttribute('class', 'same');
    }
    else {
        tbRow3CountyEl.setAttribute('class', 'less');
        tbRow4CountyEl.setAttribute('class', 'less');
    }
    // state data
    tbRow1StateEl.textContent = dataObj.confirmed;
    var stateCasesDiff = parseInt(dataObj.confirmed_diff);
    tbRow2StateEl.textContent = stateCasesDiff;
    if (stateCasesDiff > 0) {
        tbRow1StateEl.setAttribute('class', 'more');
        tbRow2StateEl.setAttribute('class', 'more');
    }
    else if (stateCasesDiff === 0) {
        tbRow1StateEl.setAttribute('class', 'same');
        tbRow2StateEl.setAttribute('class', 'same');
    }
    else {
        tbRow1StateEl.setAttribute('class', 'less');
        tbRow2StateEl.setAttribute('class', 'less');
    }
    tbRow3StateEl.textContent = dataObj.deaths;
    var stateDeathsDiff = dataObj.deaths_diff;
    tbRow4StateEl.textContent = stateDeathsDiff;
    if (parseInt(stateDeathsDiff) > 0) {
        tbRow3StateEl.setAttribute('class', 'more');
        tbRow4StateEl.setAttribute('class', 'more');
    }
    else if (parseInt(countyDeathsDiff) === 0) {
        tbRow3StateEl.setAttribute('class', 'same');
        tbRow4StateEl.setAttribute('class', 'same');
    }
    else {
        tbRow3StateEl.setAttribute('class', 'less');
        tbRow4StateEl.setAttribute('class', 'less');
    }
    var fatalityRateCounty = parseInt(dataObj.region.cities[0].deaths) / parseInt(dataObj.region.cities[0].confirmed);
    tbRow5CountyEl.textContent = `${(fatalityRateCounty * 100).toFixed(2)} %`;
    tbRow5StateEl.textContent = `${(dataObj.fatality_rate * 100).toFixed(2)} %`;
};
*/

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