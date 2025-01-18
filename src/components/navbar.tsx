import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate  } from 'react-router-dom'; 
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import Artworked from '../assets/Artworked-logoonly.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faMagnifyingGlass, faPlus , faHeart, faComment, faRightFromBracket, faArrowLeft} from '@fortawesome/free-solid-svg-icons';
import { AppContext } from '../App';
import { useGetUserDetails } from '../hooks/useGetUserDetails';
import { collection, doc, getDocs, onSnapshot, orderBy, query, Timestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';
import { encryptData } from '../helpers/encryptionUtils';


interface Notification {
  id: string;
  createdAt: Timestamp;
  postId: string;
  triggeredBy: string;
  triggeredByProfilePicture: string;
  triggeredByUsername: string;
  type: string;
  read: boolean,
  
}
interface SearchUser {
  id: string;
  username: string;
  profilePic: string;
}

export const Navbar = () => {
    const {user, username, email, profilePic} = useGetUserDetails();
    const {setOpenPost, setIsFirstRenderPost} = useContext(AppContext);
    const [openUser, setOpenUser] = useState(false);
    const [notifications, setNotifications] = useState<Notification[] | null>(null);
    const location = useLocation();
    const [fadeUser, setFadeUser] = useState<string>("animate-fadeIn");
    const [fadeNotif, setFadeNotif] = useState<string>("animate-fadeIn");
    const [openNotif, setOpenNotif] = useState<boolean>(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const navigate = useNavigate();
    const [openSearch, toggleOpenSearch] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<SearchUser[]>([]);
   
    
    // Reset the navigation bar state on route change
    useEffect(() => {
      setOpenNotif(false); 
      setOpenUser(false);
      setResults([]);
      setSearchTerm("");
    }, [location]);
    

    const handleSearch = async () => {
      if (!searchTerm.trim()) return; // Avoid empty searches
      const lowercaseUsername = searchTerm.toLowerCase();
      try {
        const usersRef = collection(db, "users"); // Replace 'users' with your Firestore collection
        const userQuery = query(
          usersRef,
          where("lowercaseUsername", ">=", lowercaseUsername),
          where("lowercaseUsername", "<=", lowercaseUsername + "\uf8ff")
        );
        const querySnapshot = await getDocs(userQuery);
  
        const users: SearchUser[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          username: doc.data().username as string,
          profilePic: doc.data().profilePic as string,
        }));
        setResults(users); // Set the results with the fetched data
      } catch (error) {
        console.error("Error searching users:", error);
        toast.error("An error occurred!", {
            position: "top-center",
            theme:"colored",
            });
      } 
    };

    useEffect(() =>{
      if(searchTerm===""){setResults([])}
      handleSearch();
    },[searchTerm]);

  // Define the fetchNotifications function
  const fetchNotifications = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      const notificationsRef = collection(db, 'notifications', user.uid, 'notifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const newNotifications = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      setNotifications(newNotifications);

      // Set unread count
      const unread = newNotifications.filter((notif) => !notif.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("An error occurred!", {
          position: "top-center",
          theme:"colored",
          });
    }
  };

  // Real-time listener for notifications
  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const notificationsRef = collection(db, 'notifications', user.uid, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const updatedNotifications = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      setNotifications(updatedNotifications);

      // Update unread count
      const unread = updatedNotifications.filter((notif) => !notif.read).length;
      setUnreadCount(unread);
    });

    // Cleanup the listener when the component unmounts or user changes
    return () => unsubscribe();
  }, [user?.uid]); 

  useEffect(()=>{
    setOpenPost(false);
    setOpenNotif(false);
    setOpenUser(false);
  },[]);

  //  list of routes where the navbar should be hidden
  const hideNavbarRoutes = ['/login']; 
  
  // Check if the current location matches any of the hideNavbarRoutes
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  // Early return if the navbar should be hidden
  if (shouldHideNavbar) return null;

    const signUserOut = async () => {
        await signOut(auth);
    }
  
    const checkTypeMessage = (type: string) => {
      if(type === "like"){ return "liked your post!"}
      else if (type === "comment"){ return "commented to your post!"}
      else{ return }
    }

    const checkTypeIcon= (type: string) => {
      if(type === "like"){ return  <FontAwesomeIcon icon={faHeart} style={{ fontSize: "8px" }} />}
      else if (type === "comment"){ return  <FontAwesomeIcon icon={faComment} style={{ fontSize: "8px" }} />}
      else{ return }
    }

    const markAsRead = async (userId: string, notificationId: string) => {
      const notifRef = doc(db, "notifications", userId, "notifications", notificationId);
      try {
        await updateDoc(notifRef, { read: true });
        console.log("Notification marked as read.");
      } catch (error) {
        console.error("Error marking notification as read:", error);
        toast.error("An error occurred!", {
            position: "top-center",
            theme:"colored",
        });
      }
    };

    const markAllAsRead = async () => {
      if (!user?.uid) return;
    
      try {
        // Reference to the notifications collection for the user
        const notificationsRef = collection(db, "notifications", user?.uid, "notifications");
        // Query to get all notifications that are unread
        const q = query(notificationsRef, where("read", "==", false));  // Only get unread notifications
    
        const querySnapshot = await getDocs(q);  // Fetch unread notifications
    
        // Iterate over the notifications and update each to 'read'
        const batch = writeBatch(db);  // Using Firestore batch for atomic updates
        querySnapshot.forEach(doc => {
          const notifRef = doc.ref;  // Reference to the individual notification
          batch.update(notifRef, { read: true });  // Mark as read
        });
    
        // Commit the batch to apply the changes
        await batch.commit();
    
        console.log("All notifications marked as read.");
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        toast.error("An error occurred!", {
          position: "top-center",
          theme:"colored",
      });
      }
    };
    
    const openNotification = () => {
      if (openNotif) {
        setFadeNotif("animate-fadeOut"); 
        setTimeout(() => {
          fetchNotifications();
          setOpenNotif(false); 
        }, 300); 
      } else {
        markAllAsRead();
        setOpenUser(false);
        setFadeNotif("animate-fadeIn"); 
        setOpenNotif(true);
      }
    };

    const openUserDropdown = () => {
      if (openUser) {
        setFadeUser("animate-fadeOut"); 
        setTimeout(() => {
          setOpenUser(false); 
        }, 300); 
      } else {
        setOpenNotif(false);
        setFadeUser("animate-fadeIn"); 
        setOpenUser(true);
      }
    };



    return (
    <div className='navbar relative'>
        <div className={`left ${ openSearch ? "sm:relative sm:w-full absolute z-30 w-[90%]  bg-primary": "w-full"} `}>
            <Link to ="/" className='flex'> 
                {!openSearch && 
                  <div  className="w-8 h-8 mr-1 sm:mr-0">
                      <img className="w-full h-full" src={Artworked} alt="Artworked Logo" />
                  </div>
                  
                }
                <p className='text-base mr-3 hidden sm:block'>RTWORKED</p>
            </Link>
                {user &&
                <div className='block sm:hidden' onClick={()=> { setSearchTerm(""); toggleOpenSearch(!openSearch); }}>
                  {!openSearch ? 
                    <FontAwesomeIcon icon={faMagnifyingGlass} className='navButton text-primary'/>: 
                    <FontAwesomeIcon icon={faArrowLeft} className='navButton text-primary'/>}
                </div> 
                }

          
            {user && 
                <div className='relative w-full'>
                    <div className={`${openSearch ? "block" : "hidden"} sm:block relative w-full z-50 mx-3`}>
                        <input
                            type="text"
                            placeholder="Search User..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className=" w-full outline-none bg-white h-10 pl-10 pr-3 py-2 rounded-md text-gray-600 text-sm shadow-sm focus:ring-2 focus:ring-secondary focus:border-secondary"
                            aria-label="Search"
                        />
                        <FontAwesomeIcon
                            icon={faMagnifyingGlass}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"
                        />
                  </div>
                  <div className='search'>
                      <div className='bg-white px-2'>
                        {results?.length ? (
                            results.map((searchData) => (
                              <div
                                key={searchData.id}
                                onClick={() => { 
                                  navigate(`/userprofile/${encodeURIComponent(encryptData(searchData.id))}`);}}
                        
                                className="group flex items-center gap-3 py-2 border-b"
                              >
                                <div className="relative">
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={searchData.profilePic || "https://res.cloudinary.com/dqp0ejscz/image/upload/v1735899431/blank-profile-picture-973460_1280_idgyn3.png"}
                                    alt=""
                                  />
                                </div>
                                <div className="w-11/12">
                                  <p className="text-sm font-black">
                                    {searchData.username}
                                  </p>
                                </div>
                              </div>
                            ))
                          ): "" }
                      </div>
                    
                  </div>
                </div>
            } 
        </div>

    
          <div className={`w-full `}>
           {!user ? (<div className='right'><Link to ="/login"> Login </Link></div>) : 
              (
                <div className='right'>
                  {
                    location.pathname === "/" &&
                    <button> <FontAwesomeIcon icon={faPlus} className='navButton text-primary' onClick={()=> {setOpenPost(true); setIsFirstRenderPost(false);}}/></button>
                  }
                  
                  <div>
                      <button
                        data-dropdown-toggle="dropdownNotif"
                        className="relative flex"
                        onClick={openNotification}
                      >
                        <FontAwesomeIcon icon={faBell} className="navButton text-primary" />
                        {(unreadCount ?? 0) > 0 && (
                          <span
                            style={{ fontSize: "10px" }}
                            className="absolute top-0 left-7 w-5 h-5 bg-red-500 border-primary border-2 text-white rounded-full flex items-center justify-center"
                          >
                            {unreadCount || 0}
                          </span>
                        )}
                      </button>
                      {openNotif && 
                        <div id="dropdownNotif" className={`notification scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full   ${fadeNotif}`}>
                          <div className="flex items-center justify-center py-2">
                            <p className="text-sm">Notifications</p>
                          </div>

                          {notifications?.length ? (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => { 
                                markAsRead(user?.uid, notif.id);
                                navigate(`/post/${notif.postId}`);}}
                       
                              className={`group flex items-center gap-3 py-2 ${
                                notif.read ? "bg-white" : "bg-light"
                              } hover:bg-light px-3 transition-all duration-300`}
                            >
                              <div className="relative">
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={notif.triggeredByProfilePicture || "https://res.cloudinary.com/dqp0ejscz/image/upload/v1735899431/blank-profile-picture-973460_1280_idgyn3.png"}
                                  alt=""
                                />
                                <span className="flex justify-center items-center bottom-0 left-6 absolute w-5 h-5 bg-primary border-2 border-white text-light rounded-full">
                                  {checkTypeIcon(notif.type)}
                                </span>
                              </div>
                              <div className="w-11/12">
                                <p className="text-sm font-black">
                                  {notif.triggeredByUsername} {checkTypeMessage(notif.type)}
                                </p>
                                <p style={{ fontSize: "10px" }} className="text-secondary">
                                  {notif.createdAt
                                    ? `${formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}`
                                    : "Just now"}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center  w-full h-36">
                            <p className="text-sm text-secondary">No notifications</p>
                          </div>
                        )}


                        </div>
                      }
                    </div>

                    
                    <div>
                        <button id="dropdownUserAvatarButton" data-dropdown-toggle="dropdownAvatar" className='relative flex' type="button" onClick={()=>{openUserDropdown()}}><img src ={profilePic || "https://res.cloudinary.com/dqp0ejscz/image/upload/v1735899431/blank-profile-picture-973460_1280_idgyn3.png"} className='h-10 w-10 rounded-full object-cover ml-4'/></button>
                        { openUser &&
                          <div id="dropdownAvatar" className={ `user ${fadeUser}` } >
                            <div className="px-4 py-3 text-sm hover:bg-light rounded-t-lg" onClick={() =>{navigate(`/userprofile/${encodeURIComponent(encryptData(user?.uid))}`); setOpenUser(false);}}>
                                <div>{username}</div>
                                <div className="font-medium truncate">{email}</div>
                            </div>
                            <div className="py-2">
                                <button className=" flex text-center  px-4 py-2 text-sm text-primary  dark:hover:bg-light w-full " onClick={signUserOut}> <FontAwesomeIcon icon={faRightFromBracket} className="text-opacity-60 text-lg text-secondary pr-4" /> Sign Out</button>
                            </div>
                          </div>
                        }
                    </div>
                    
                  </div>
                  
              ) 
            }
        </div>
        <ToastContainer />
    </div>
)
};

