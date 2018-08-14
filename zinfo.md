# Info while Dev

# Node Documentation for File-Manipulation:
https://nodejs.org/docs/latest-v9.x/api/fs.html#fs_fs_readfile_path_options_callback


# Location to see the JSON data we got from the parsing: 
http://jsonviewer.stack.hu/

# Even better look: 
https://jsoneditoronline.org/


======================================================
# When creating a new account

- Create record on [users] table
- Create record on [user_roles] table (Automatic when using the API)
- Create record on [CrystalPoints] 
- Update OwnerUserId all records on [CrystalPointsTransaction] table that fullfill the following:  
    a) Email: is equal to the email used when creating the account. 
    b) OwnerUserId: '00000000-0000-0000-0000-000000000000'
======================================================