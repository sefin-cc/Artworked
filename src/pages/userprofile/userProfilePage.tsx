import React, { useEffect, useState } from "react"
import { useGetUserDetails } from "../../hooks/useGetUserDetails";
import { db } from "../../config/firebase";
import { collection, doc, getDoc, getDocs, orderBy, query, where,  } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingScreen } from "../../components/loadingscreen";
import { Post } from "../main/main";
import { decryptData } from "../../helpers/encryptionUtils";

interface UserProfileData {
    id: string;
    username: string;
    bio?: string;
    profilePic?: string;
    bannerPic?: string;
  }

  export const UserProfilePage = () => {
    const { encryptedId } = useParams<string>();
    const { user } = useGetUserDetails();
    const [isLoading, setIsLoading] = useState(false);
    const [postsList, setPostList] = useState<Post[] | null>(null);
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserProfileData>({
      id: '',
      username: 'Artworked User',
      bio: '',
      profilePic: '',
      bannerPic: '',
    });

    if (!encryptedId) {
      throw new Error("Encrypted ID is missing or invalid.");
    }
    const userId = decryptData<string>(decodeURIComponent(encryptedId));

        //get the data from the  collection
        const getPost = async () => {
            try {
            
              setIsLoading(true); 
           
              const postsRef = collection(db, "posts");
              const q = query(postsRef, where("userId", "==", userId), orderBy('createdAt', 'desc')); 

                // Fetch data from the collection
                const data = await getDocs(q);
            
                // Map the data and set it to the state
                setPostList(
                  data.docs.map((doc) => ({
                    ...doc.data(),
                    id: doc.id,
                  })) as Post[]
                );
              } catch (error) {
                console.error("Error fetching posts:", error);
              } finally {
                setIsLoading(false); // Always reset loading state
              }
        }

    // Fetch user details
    const getUserDetails = async () => {
        if (!userId) return; 
        const userRef = doc(db, 'users', userId); 
        try {
            setIsLoading(true);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
                const userData = userDoc.data() as UserProfileData;
                setUserData({
                ...userData, 
                id: userDoc.id, 
                });
            } else {
                console.error('No such user!');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setIsLoading(false);
        }
      };
      
    // UseEffect to fetch details when userId changes
    useEffect(() => {
      if (userId) {
        getUserDetails();
        getPost();
      }
    }, [userId]);

    return(
        <div className=" overflow-hidden"  style={{ height: 'calc(100vh - 64px)' }}>
        <section className="relative pt-36 pb-24 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full  ">
          <img
            src={userData.bannerPic !== '' ? userData.bannerPic : undefined}
            className="w-full absolute top-0 left-0 z-0 h-60 object-cover bg-gray-400"
          />
      
          <div className="w-full max-w-7xl mx-auto px-1">
            <div className="flex items-center justify-center relative z-10 mb-2.5">
              <img
                src={userData.profilePic || "https://res.cloudinary.com/dqp0ejscz/image/upload/v1735899431/blank-profile-picture-973460_1280_idgyn3.png"}
                alt="user-avatar-image"
                className="border-4 border-solid w-44 h-44 border-light rounded-full object-cover"
              />
            </div>
      
            <h3 className="text-center font-manrope font-bold text-3xl leading-10 text-gray-900 mb-3">
              {userData.username}
            </h3>
            <p className="font-normal text-base leading-7 text-gray-500 text-center mb-8">
              {userData.bio}
            </p>
            <div className="flex w-full top-0 justify-center  md:justify-end ">
              {userId === user?.uid && (
                <button
                  onClick={() =>navigate("/usersettings")}
                  className="w-fit text-white bg-primary hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 rounded-lg text-sm px-5 py-2 hover:cursor-pointer text-center"
                >
                  Edit Profile
                </button>
              )}
            </div>
      
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
              {postsList?.map((post, i) => (
                <div key={i}>
                  <img
                    className="h-auto max-w-full rounded-lg hover:cursor-pointer"
                    src={post.imagepost || ""}
                    onClick={()=> navigate(`/post/${post.id}`)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="h-64 w-full"></div>
        </section>
        {isLoading && <LoadingScreen />}
      </div>
      
    );
}