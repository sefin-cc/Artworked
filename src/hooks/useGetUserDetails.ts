import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";


export const useGetUserDetails = () => {
    const [user] = useAuthState(auth);
     const [isGetUserLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState<string | null>(null);  
    const [email, setEmail] = useState<string | null>(null); 
    const [profilePic, setProfilePic] = useState<string | null>(null);  
    const [bannerPic, setBannerPic] = useState<string | null>(null);
    const [bio, setBio] = useState<string | null>(null);

    useEffect(() => {
      // If user is logged in, fetch their username from Firestore
      const fetchUsername = async () => {
        if (user) {
          setIsLoading(true);
          try {
            const userRef = doc(db, "users", user.uid);  
            const userDoc = await getDoc(userRef); 
  
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUsername(userData?.username || "");  
              setProfilePic(userData?.profilePic || "https://res.cloudinary.com/dqp0ejscz/image/upload/v1735899431/blank-profile-picture-973460_1280_idgyn3.png");
              setEmail(userData?.email || "");
              setBannerPic(userData?.bannerPic || "");
              setBio(userData?.bio || "")
            } else {
              console.log("User document not found.");
            }
          } catch (error) {
            console.error("Error fetching: ", error);
          } finally {
            setIsLoading(false);
          }
        }
      };
  
      fetchUsername();
    }, [user, db]);  // Effect depends on the authenticated user
    
    
    return{user, username, email, profilePic, bannerPic, bio, isGetUserLoading};

}