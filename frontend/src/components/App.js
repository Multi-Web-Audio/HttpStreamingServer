import React, { useEffect, useState } from 'react';
import {useHistory, useLocation } from 'react-router-dom';
import Login from './login/login';
import Signup from './login/signup';
import { AuthContext } from './context/auth';
import { client } from '../api/djangoAPI';
import Header from "./header/Header";
import './App.css'
import Carousels from "./Carousels/Carousels";
import AccessDenied from "./AccessDenied";
import TransmissionClient from './torrents.js'
const utils = require ("./../utils/utils");

function App(props) {
    
    var existingTokens;
    const [authTokens, setAuthTokens] = useState(null);
    const [userInfos, setUserInfos] = useState(null);
    useEffect( () => {
        async function checktoken(){
        try{
            existingTokens = JSON.parse(localStorage.getItem("tokens"));
            if (existingTokens) {
                client.setToken(existingTokens);
                //We try to get user info here to check if the token is still valid
                setAuthTokens(existingTokens);
                const user_response_info = await client.getUserInfo();
                setUserInfos(user_response_info);
            }
         }
         catch {
             console.log("Token is invalid, logout and reset localstorage");
             setAuthTokens(null);
             client.resetToken();
             client.logout();
             localStorage.removeItem("tokens");
         }
       }
       checktoken();
    
       }, []);
    
    const [pager, setPager] = useState(null);
    const [displayModal, setDisplayModal] = useState(false);
    const [toggleModal, setToggleModal] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [moviesPager, setMoviesPager] = useState(null);
    const [historyPager, setHistoryPager] = useState(null);
    const [seriesPager, setSeriesPager] = useState(null);
    const [moviesVideos, setMoviesVideos] = useState([]);
    const [seriesVideos, setSeriesVideos] = useState([]);
    const [isInitialVideoDone, setInitialVideoDone] = useState(false);
    const [videos, setVideos] = useState([]);
    const [displayTorrent, setDisplayTorrent] = useState(false);
    const location = useLocation();
    const history = useHistory();

    useEffect(() => {
        // Create an scoped async function in the hook
        const fetchData = async () => {
            await Promise.all([
                utils.getMoviesAndSeries(setPager, setVideos, setSeriesPager, setSeriesVideos, setMoviesPager, setMoviesVideos),
                utils.getUrlVideo(location, setSelectedVideo)
            ]);
            setInitialVideoDone(true);
        };
        async function GetHistory() {
            try{
                if(authTokens && authTokens.key !== "" && client.isLoggedIn()){
                    const history = await client.getHistory();
                    setHistoryPager(history)
                }
            }
            catch{
                // We catch here the exception if a token was retrieved locally in the browser but not present
                // in the server anymore.
                setAuthTokens(null);
                client.resetToken();
                client.logout();
                localStorage.removeItem("tokens");
            }
        }    // Execute the created function directly
        GetHistory();
        fetchData();

    }, [authTokens]);

    const handleVideoSelect  = async (video) => {
        const videoHistory = await client.getVideoById(video.id);
        video.time = videoHistory.time;
        video.nextEpisode = videoHistory.nextEpisode;
        video.subtitles = videoHistory.subtitles;
        setSelectedVideo(video);
        if (video) {
            history.push(`/streaming/?video=${video.id}`);
            document.title = video.name;
        }
        // change tab title with the name of the selected video
        window.scrollTo(0, 0);
    };


    const displayModalBox = (isDisplay) =>{
        setDisplayModal(isDisplay);
    }
    const toggleModalBox = () =>{
        setToggleModal(!toggleModal);
    }


    const handleSubmit = async (termFromSearchBar) => {
        // API call to retrieve videos from searchbar
        try {
            const [fetchPager, fetchPager2] = await Promise.all([
                client.searchSeries(termFromSearchBar),
                client.searchMovies(termFromSearchBar),
            ]);
            if (fetchPager.series.length > 0) {
                setSeriesPager(fetchPager);
                setSeriesVideos(fetchPager.series);
            }
            if (fetchPager2.videos.length > 0) {
                setMoviesPager(fetchPager2);
                setMoviesVideos(fetchPager2.videos);
            }
        } catch (error) {
            console.log(error);
        }
    };




    const setTokens = (data) => {
        localStorage.setItem('tokens', JSON.stringify(data));
        setAuthTokens(data);
    };

    return (
        <AuthContext.Provider value={{ authTokens, setAuthTokens: setTokens }}>
            <Header
                handleFormSubmit={handleSubmit}
                displayModal={displayModalBox}
                client={client}
                userinfos={userInfos}
                setUserInfos={setUserInfos}
                displaytorrent={displayTorrent}
                setDisplayTorrent={setDisplayTorrent}
            />
            {authTokens ?
                <Carousels
                    video={selectedVideo}
                    handleVideoSelect={handleVideoSelect}
                    setHistoryPager={setHistoryPager}
                    authTokens={authTokens}
                    historyPager={historyPager}
                    seriesPager={seriesPager}
                    seriesVideos={seriesVideos}
                    moviesPager={moviesPager}
                    moviesVideos={moviesVideos}
                    isInitialVideoDone={isInitialVideoDone}
                />
                :
                <AccessDenied/>

            }
            {displayTorrent ?
                <TransmissionClient/>:null}
            
            {(displayModal && toggleModal) &&
            <Login
                toggleModalBox={toggleModalBox}
                setDisplayModal={setDisplayModal}
                client={client}
                userinfos={userInfos}
                setUserInfos={setUserInfos}
            />}
            {(displayModal && !toggleModal) &&
            <Signup
                toggleModalBox={toggleModalBox}
                setDisplayModal={setDisplayModal}
                client={client}
                userinfos={userInfos}
                setUserInfos={setUserInfos}
           />}

        </AuthContext.Provider>
    );
}

export default App;
