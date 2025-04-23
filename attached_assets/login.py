import streamlit as st
import hashlib
import pickle
import os
from pathlib import Path

def make_hashed_password(password):
    """Hash a password for storing."""
    return hashlib.sha256(str.encode(password)).hexdigest()

def check_password(password, hashed_password):
    """Check hashed password."""
    return make_hashed_password(password) == hashed_password

def save_users(users):
    """Save users dictionary to a file."""
    # Create the data directory if it doesn't exist
    data_dir = Path("./data")
    data_dir.mkdir(exist_ok=True)
    
    # Save the users dictionary
    with open("./data/users.pkl", "wb") as f:
        pickle.dump(users, f)

def load_users():
    """Load users dictionary from a file."""
    try:
        with open("./data/users.pkl", "rb") as f:
            return pickle.load(f)
    except FileNotFoundError:
        return {}

def login_page():
    """Display the login page and handle authentication."""
    if 'logged_in' not in st.session_state:
        st.session_state['logged_in'] = False
    
    if 'username' not in st.session_state:
        st.session_state['username'] = ""
        
    if 'users' not in st.session_state:
        st.session_state['users'] = load_users()
    
    if st.session_state['logged_in']:
        return True
    
    st.title("🔒 Login / Register")
    
    tab1, tab2 = st.tabs(["Login", "Register"])
    
    with tab1:
        st.subheader("Login to your account")
        login_username = st.text_input("Username", key="login_username")
        login_password = st.text_input("Password", type="password", key="login_password")
        
        if st.button("Login"):
            if login_username in st.session_state['users']:
                if check_password(login_password, st.session_state['users'][login_username]):
                    st.session_state['logged_in'] = True
                    st.session_state['username'] = login_username
                    st.success(f"Welcome back, {login_username}!")
                    st.rerun()
                else:
                    st.error("Incorrect password. Please try again.")
            else:
                st.error("User does not exist. Please register.")
    
    with tab2:
        st.subheader("Create a new account")
        reg_username = st.text_input("Username", key="reg_username")
        reg_password = st.text_input("Password", type="password", key="reg_password")
        reg_confirm_password = st.text_input("Confirm Password", type="password", key="reg_confirm_password")
        
        if st.button("Register"):
            if not reg_username:
                st.error("Username cannot be empty.")
            elif not reg_password:
                st.error("Password cannot be empty.")
            elif reg_password != reg_confirm_password:
                st.error("Passwords do not match.")
            elif reg_username in st.session_state['users']:
                st.error("Username already exists. Please choose another.")
            else:
                # Hash the password before storing
                hashed_password = make_hashed_password(reg_password)
                
                # Add the new user
                st.session_state['users'][reg_username] = hashed_password
                save_users(st.session_state['users'])
                
                st.success("Registration successful! You can now login.")
    
    # Add info about demo account
    st.markdown("---")
    st.markdown("**Demo Account:**")
    st.code("Username: demo\nPassword: demo123")
    
    # Create a demo account if it doesn't exist
    if 'demo' not in st.session_state['users']:
        st.session_state['users']['demo'] = make_hashed_password('demo123')
        save_users(st.session_state['users'])
    
    return False

def logout():
    """Log out the current user."""
    st.session_state['logged_in'] = False
    st.session_state['username'] = ""