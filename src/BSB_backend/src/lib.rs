use std::collections::HashMap;
use candid::{CandidType, Deserialize, Principal};
use ic_cdk::{query, update, init, storage, caller};
use serde::Serialize;
use std::cell::RefCell;

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub struct UserProfile {
    principal_id: Principal,
    name: String,
    bio: String,
    profile_image_url: Option<String>,
    cover_photo_url: Option<String>,
    followers: Vec<Principal>,
    following: Vec<Principal>,
}

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub struct Comment {
    author: Principal,
    text: String,
    timestamp: u64,
}

#[derive(CandidType, Clone, Deserialize, Serialize, Debug)]
pub struct Post {
    post_id: u64,
    author: Principal,
    content: String,
    image_url: Option<String>,
    likes: Vec<Principal>,
    comments: Vec<Comment>,
    timestamp: u64,
}

thread_local! {
    static PROFILES: RefCell<HashMap<Principal, UserProfile>> = RefCell::new(HashMap::new());
    static POSTS: RefCell<Vec<Post>> = RefCell::new(Vec::new());
    static POST_ID_COUNTER: RefCell<u64> = RefCell::new(0);
    static TIMESTAMP_COUNTER: RefCell<u64> = RefCell::new(1625097600); // July 1, 2021 as a starting timestamp
}

fn get_timestamp() -> u64 {
    // Use a counter for timestamps instead of system time
    TIMESTAMP_COUNTER.with(|counter| {
        let current = *counter.borrow();
        *counter.borrow_mut() = current + 60; // Increment by 60 seconds for each call
        current
    })
}

fn get_next_post_id() -> u64 {
    POST_ID_COUNTER.with(|counter| {
        let next_id = *counter.borrow();
        *counter.borrow_mut() = next_id + 1;
        next_id
    })
}

#[init]
fn init() {
    let admin = caller();
    
    // Add a dummy user profile for testing
    let dummy_profile = UserProfile {
        principal_id: admin,
        name: "Admin User".to_string(),
        bio: "This is a test admin account for the social media app.".to_string(),
        profile_image_url: Some("https://picsum.photos/200".to_string()),
        cover_photo_url: Some("https://picsum.photos/800/300".to_string()),
        followers: Vec::new(),
        following: Vec::new(),
    };
    
    PROFILES.with(|profiles| {
        profiles.borrow_mut().insert(admin, dummy_profile);
    });
    
    // Add a dummy post for testing
    let dummy_post = Post {
        post_id: get_next_post_id(),
        author: admin,
        content: "Welcome to our decentralized social media app! This is the first post.".to_string(),
        image_url: Some("https://picsum.photos/400/300".to_string()),
        likes: Vec::new(),
        comments: Vec::new(),
        timestamp: get_timestamp(),
    };
    
    POSTS.with(|posts| {
        posts.borrow_mut().push(dummy_post);
    });
    
    // Create a second dummy user
    // Note: In a real application, you would use a proper Principal ID
    // For testing, we're creating one from a hardcoded text
    let dummy_principal = Principal::from_text("2vxsx-fae").unwrap_or(admin);
    
    // Only add the second user if it's different from admin
    if dummy_principal != admin {
        let second_user = UserProfile {
            principal_id: dummy_principal,
            name: "Jane Smith".to_string(),
            bio: "I love exploring blockchain technology and decentralized applications.".to_string(),
            profile_image_url: Some("https://picsum.photos/id/237/200".to_string()),
            cover_photo_url: Some("https://picsum.photos/id/1019/800/300".to_string()),
            followers: Vec::new(),
            following: Vec::new(),
        };
        
        PROFILES.with(|profiles| {
            profiles.borrow_mut().insert(dummy_principal, second_user);
        });
        
        // Add a dummy post from the second user
        let second_post = Post {
            post_id: get_next_post_id(),
            author: dummy_principal,
            content: "Excited to join this decentralized social network! Hello everyone!".to_string(),
            image_url: Some("https://picsum.photos/id/1084/400/300".to_string()),
            likes: Vec::new(),
            comments: Vec::new(),
            timestamp: get_timestamp(),
        };
        
        POSTS.with(|posts| {
            posts.borrow_mut().push(second_post);
        });
    }
}

#[update]
fn create_profile(name: String, bio: String, profile_image_url: Option<String>, cover_photo_url: Option<String>) -> Result<(), String> {
    let principal = caller();
    
    PROFILES.with(|profiles| {
        if profiles.borrow().contains_key(&principal) {
            return Err("Profile already exists".to_string());
        }
        
        let profile = UserProfile {
            principal_id: principal,
            name,
            bio,
            profile_image_url,
            cover_photo_url,
            followers: Vec::new(),
            following: Vec::new(),
        };
        
        profiles.borrow_mut().insert(principal, profile);
        Ok(())
    })
}

#[update]
fn update_profile(name: String, bio: String, profile_image_url: Option<String>, cover_photo_url: Option<String>) -> Result<(), String> {
    let principal = caller();
    
    PROFILES.with(|profiles| {
        let mut profiles_mut = profiles.borrow_mut();
        
        if let Some(profile) = profiles_mut.get_mut(&principal) {
            profile.name = name;
            profile.bio = bio;
            profile.profile_image_url = profile_image_url;
            profile.cover_photo_url = cover_photo_url;
            Ok(())
        } else {
            Err("Profile does not exist".to_string())
        }
    })
}

#[query]
fn get_profile(user: Principal) -> Result<UserProfile, String> {
    PROFILES.with(|profiles| {
        match profiles.borrow().get(&user) {
            Some(profile) => Ok(profile.clone()),
            None => Err("Profile not found".to_string()),
        }
    })
}

#[query]
fn get_my_profile() -> Result<UserProfile, String> {
    let principal = caller();
    get_profile(principal)
}

#[update]
fn create_post(content: String, image_url: Option<String>) -> Result<Post, String> {
    let principal = caller();
    
    // Check if user has a profile
    PROFILES.with(|profiles| {
        if !profiles.borrow().contains_key(&principal) {
            return Err("You must create a profile first".to_string());
        }
        Ok(())
    })?;
    
    let post = Post {
        post_id: get_next_post_id(),
        author: principal,
        content,
        image_url,
        likes: Vec::new(),
        comments: Vec::new(),
        timestamp: get_timestamp(),
    };
    
    POSTS.with(|posts| {
        posts.borrow_mut().push(post.clone());
        Ok(post)
    })
}

#[query]
fn get_all_posts() -> Vec<Post> {
    POSTS.with(|posts| {
        let mut result = posts.borrow().clone();
        result.sort_by(|a, b| b.timestamp.cmp(&a.timestamp)); // Sort by newest first
        result
    })
}

#[query]
fn get_posts_by_user(user: Principal) -> Vec<Post> {
    POSTS.with(|posts| {
        let mut result: Vec<Post> = posts
            .borrow()
            .iter()
            .filter(|post| post.author == user)
            .cloned()
            .collect();
        
        result.sort_by(|a, b| b.timestamp.cmp(&a.timestamp)); // Sort by newest first
        result
    })
}

#[update]
fn like_post(post_id: u64) -> Result<(), String> {
    let principal = caller();
    
    POSTS.with(|posts| {
        let mut posts_mut = posts.borrow_mut();
        let post = posts_mut
            .iter_mut()
            .find(|p| p.post_id == post_id)
            .ok_or("Post not found".to_string())?;
        
        if post.likes.contains(&principal) {
            // If already liked, unlike it
            post.likes.retain(|&p| p != principal);
        } else {
            // Otherwise like it
            post.likes.push(principal);
        }
        
        Ok(())
    })
}

#[update]
fn comment_post(post_id: u64, text: String) -> Result<(), String> {
    let principal = caller();
    
    POSTS.with(|posts| {
        let mut posts_mut = posts.borrow_mut();
        let post = posts_mut
            .iter_mut()
            .find(|p| p.post_id == post_id)
            .ok_or("Post not found".to_string())?;
        
        let comment = Comment {
            author: principal,
            text,
            timestamp: get_timestamp(),
        };
        
        post.comments.push(comment);
        Ok(())
    })
}

#[update]
fn follow_user(target: Principal) -> Result<(), String> {
    let principal = caller();
    
    if principal == target {
        return Err("Cannot follow yourself".to_string());
    }
    
    PROFILES.with(|profiles| {
        let mut profiles_mut = profiles.borrow_mut();
        
        // Check if target user exists
        if !profiles_mut.contains_key(&target) {
            return Err("Target user does not exist".to_string());
        }
        
        // Update current user's following
        let current_user = profiles_mut
            .get_mut(&principal)
            .ok_or("You don't have a profile".to_string())?;
        
        if !current_user.following.contains(&target) {
            current_user.following.push(target);
        }
        
        // Update target user's followers
        let target_user = profiles_mut.get_mut(&target).unwrap();
        if !target_user.followers.contains(&principal) {
            target_user.followers.push(principal);
        }
        
        Ok(())
    })
}

#[update]
fn unfollow_user(target: Principal) -> Result<(), String> {
    let principal = caller();
    
    PROFILES.with(|profiles| {
        let mut profiles_mut = profiles.borrow_mut();
        
        // Update current user's following
        let current_user = profiles_mut
            .get_mut(&principal)
            .ok_or("You don't have a profile".to_string())?;
        
        current_user.following.retain(|&p| p != target);
        
        // Update target user's followers if they exist
        if let Some(target_user) = profiles_mut.get_mut(&target) {
            target_user.followers.retain(|&p| p != principal);
        }
        
        Ok(())
    })
}

#[query]
fn is_following(user: Principal, target: Principal) -> bool {
    PROFILES.with(|profiles| {
        let profiles_ref = profiles.borrow();
        
        match profiles_ref.get(&user) {
            Some(profile) => profile.following.contains(&target),
            None => false,
        }
    })
}

#[query]
fn get_followers(user: Principal) -> Vec<Principal> {
    PROFILES.with(|profiles| {
        let profiles_ref = profiles.borrow();
        
        match profiles_ref.get(&user) {
            Some(profile) => profile.followers.clone(),
            None => Vec::new(),
        }
    })
}

#[query]
fn get_following(user: Principal) -> Vec<Principal> {
    PROFILES.with(|profiles| {
        let profiles_ref = profiles.borrow();
        
        match profiles_ref.get(&user) {
            Some(profile) => profile.following.clone(),
            None => Vec::new(),
        }
    })
}

ic_cdk::export_candid!();
