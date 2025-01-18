import React, { createContext, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; 
import { Main } from './pages/main/main';
import { Login } from './pages/login/login';
import './App.css';
import './index.css'
import { Navbar } from './components/navbar';
import { CreatePost } from './pages/main/posts/create-post/create-post';
import { UserProfilePage } from './pages/userprofile/userProfilePage';
import { UserSettings } from './pages/userprofile/usersettings/userSettings';
import { UserPostPage } from './pages/userpost/userPostPage';
import NotFound from './pages/notfound/NotFound';


type AppContextType = boolean; // Type definition

// Create the context with a default value (false)
export const AppContext = createContext<{ openPost: AppContextType; setOpenPost: React.Dispatch<React.SetStateAction<AppContextType>>; isFirstRenderPost: AppContextType; setIsFirstRenderPost: React.Dispatch<React.SetStateAction<AppContextType>>}>({
  openPost: false,
  setOpenPost: () => {},
  isFirstRenderPost: true,
  setIsFirstRenderPost: () => {}
});

function App() {
    const [openPost, setOpenPost] = useState<AppContextType>(false); // State for openPost
    const [isFirstRenderPost, setIsFirstRenderPost] = useState<AppContextType>(true);

    return (
        <div>
            <AppContext.Provider value={{ openPost, setOpenPost, isFirstRenderPost, setIsFirstRenderPost }}>
                <Router>
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Main />}/>
                        <Route path="/userprofile/:encryptedId" element={<UserProfilePage />} />
                        <Route path="/post/:postId" element={<UserPostPage />} />
                        <Route path="/usersettings" element={<UserSettings />} />
                        <Route path="/login" element={<Login />}/>
                        <Route path="/create-post" element={<CreatePost />}/>
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Router>
            </AppContext.Provider>
        </div>
    );
}

export default App;