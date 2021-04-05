$(function () {
    var weatherForecast = JSON.parse(localStorage.getItem('weatherForecast')) || [];

    $('[data-search-form]').on('submit', function (e) {
        e.preventDefault();
        var searchForm = $(e.target).find('#cityInput').val();

        if (searchForm === '') {
            alert('Please type a city name!');
        } else {
            fetchWeatherData(searchForm);
        }

 // Check search from Array
        $('#cityInput').val('');
    });

    function renderHistory() {
        $('#citySearchList').empty();

        for (var i = 0; i < weatherForecast.length; i++) {
            var cityLi = $('<li>').addClass('cities col-12 bg-white');
            var cityName = $('<p>').addClass('pl-3').text(weatherForecast[i].name);
            $('#citySearchList').append(cityLi.append(cityName));
        }
    }

// Update local storage when clickicking on search history
    renderHistory();
    
    $('#citySearchList').on('click', 'p', function (event) {
        fetchWeatherData(event.target.textContent)
    });

    /**
     * cityInput will be the cityName of the function
     * @param {string}cityName
     */

    function fetchWeatherData(cityName) {
        var apiUrl = 'https://api.openweathermap.org/data/2.5/weather?q=' + cityName + '&units=imperial&appid=ebeb83ac281ae433806cf721fae06c95';

        fetch(apiUrl).then(function (response) {
            if (response.status === 404) {
                alert("City Not Recognized! Remember to include spaces!");
            } else {
                return response.json();
            }
        }).then(function (weatherData) {

            $('.city-details').css('display', 'block');

    // Add Weather API weather icon url
            var weatherIconUrl = 'http://openweathermap.org/img/wn/' + weatherData.weather[0].icon + '.png';
            $('#city-title').text(weatherData.name + ' ' + moment().format('L') + ' ').append($('<img>').attr('src', weatherIconUrl));
            $('#city-temp').text('Temperature: ' + weatherData.main.temp + ' F');
            $('#city-humid').text('Humidity: ' + weatherData.main.humidity + ' %');
            $('#city-wind').text('Wind Speed: ' + weatherData.wind.speed + ' MPH');
            

    // Pass new city latitude and longitude into new fetch request 
            var currentLat = weatherData.coord.lat;
            var currentLon = weatherData.coord.lon;

            return fetch(
                'https://api.openweathermap.org/data/2.5/onecall?lat=' + currentLat + '&lon=' + currentLon + '&appid=ebeb83ac281ae433806cf721fae06c95'
            )

        }).then(function (response) {
            return response.json();
        }).then(function (uviData) {
            var sum = 0;
            for (var i = 0; i < uviData.daily.length; i++) {
                sum += parseFloat(uviData.daily[i].uvi);
            }
            var avgUvi = sum / uviData.daily.length;
            avgUvi = avgUvi.toFixed(2);

            var cityUvi = $('<span>').text(avgUvi);
            uviBg(avgUvi, cityUvi);
            var cityUviNow = $('<span>').text(uviData.current.uvi);
            uviBg(uviData.current.uvi, cityUviNow);

            $('#city-uvi').text('UV Index (Avg): ').append(cityUvi);
            $('#city-uvi-now').text('UV Index (Now): ').append(cityUviNow);


            /**
             * base on what uviData is to change bg
             * @param {Number}uviData
             * @param {Object}uviSpan
             */
            function uviBg(uviData, uviSpan) {
                if (uviData < 3) {
                    uviSpan.addClass('favorable');
                } else if (uviData >= 3 && uviData < 5) {
                    uviSpan.addClass('moderate');
                } else {
                    uviSpan.addClass('severe');
                }
            }

    // New data for each fetch request 
            var currentLat = uviData.lat;
            var currentLon = uviData.lon;

            return fetch(
                'https://api.openweathermap.org/data/2.5/forecast?lat=' + currentLat + '&lon=' + currentLon + '&units=imperial&appid=ebeb83ac281ae433806cf721fae06c95'
            )

        }).then(function (response) {
            return response.json();
        }).then(function (forecast) {

            $('.forecast').css('display', 'block');

    // clear out old data for new request
            $('.bg-primary').empty();

            var utcTime = moment().subtract(moment().format('ZZ')/100, 'hours');
            var cityTime = utcTime.add(forecast.city.timezone, 'seconds');

    
            var day1 = moment(cityTime).add(1, 'day').format('L');
            var day2 = moment(cityTime).add(2, 'days').format('L');
            var day3 = moment(cityTime).add(3, 'days').format('L');
            var day4 = moment(cityTime).add(4, 'days').format('L');
            var day5 = moment(cityTime).add(5, 'days').format('L');

    // For each forecast day traversal the list
            for (var i = 0; i < forecast.list.length; i++) {
                var forecastList = forecast.list[i];
                var indexTime = Number(forecast.list[forecast.list.length-1].dt_txt.split(' ')[1].split(':')[0]);

                if (forecastList.dt_txt.indexOf('12:00:00') !== -1) {
                    var forecastTime = forecastList.dt_txt.split(' ')[0];
                    var transTime = moment(forecastTime).format('L');
                    var weatherIconUrl = 'http://openweathermap.org/img/wn/' + forecastList.weather[0].icon + '.png';
                    
                    if (transTime === day1) {
                        appendItems('#liDay1', day1);
                    } else if (transTime === day2) {
                        appendItems('#liDay2', day2);
                    } else if (transTime === day3) {
                        appendItems('#liDay3', day3);
                    } else if (transTime === day4) {
                        appendItems('#liDay4', day4);
                    } else if (transTime === day5) {
                        appendItems('#liDay5', day5);
                    }
                }
            }


            var filterForecast = weatherForecast.filter(function (el) {
                if (el.name === cityName) {
                    return false;
                } else {
                    return true;
                }
            });

            filterForecast.unshift({
                name: cityName
            });

            weatherForecast = filterForecast;

            localStorage.setItem('weatherForecast', JSON.stringify(filterForecast));

            renderHistory();

            function createP() {
                return $('<p>').addClass('col-12 text-light mb-1');
            }

            /**
             * append <p> with text into selector
             * @param {string}selector
             * @param {string}text
             * @returns {jQuery}
             */
            function appendP(selector, text) {
                return $(selector).append(createP().text(text));
            }

            /**
             * append elements to selector
             * @param {string}selector
             * @param {string}day
             */
            function appendItems(selector, day) {
                appendP(selector, day);
                $(selector).append($('<img>').attr('src', weatherIconUrl).attr('height', '40%'));
                appendP(selector, 'Temp: ' + forecastList.main.temp + ' F');
                appendP(selector, 'Humidity: ' + forecastList.main.humidity + ' %');
            }
        })
    }
});