#!/usr/bin/env python

"""
Virtual FTP User adding/deleting script
KOksay <koray.oksay@gmail.com>

HISTORY
-------
  Version 0.1: Initial Release, 20140203
  Version 0.2: Creating/Deleting home directories, 20140204
  Version 0.3: Chown home directory, 20130205
"""


import bsddb
import optparse
import sys
import os
import shutil
from pwd import getpwnam


def parse_args():
    """ Parses config parameters """
    parser = optparse.OptionParser(usage='%prog (-a <USERNAME> -p <PASSWORD> || -d <USERNAME> (-r) || -s ) -f <VIRTUALDB_FILE>',
                                   version='%prog version 0.4\nKoray Oksay 20140522')
    parser.add_option("-a", "--add",  dest="username", default=None, help="Username to add")
    parser.add_option("-d", "--delete",  dest="del_user", default=None, help="Username to delete")
    parser.add_option("-r", "--remove_dir", action="store_true", dest="rem_dir", default=False, help="Should we remove the home directory of the deleted user?")
    parser.add_option("-p", "--password", dest="password", default=None, help="User Password")
    parser.add_option("-s", "--showdb", action="store_true", dest="showdb", default=False, help="Show Virtual User Database Content")
    parser.add_option("-f", "--file",  dest="bsddb_file", default="/etc/vsftpd/vsftpd-virtual-user.db",
                      help="Virtual User Database. Default it /etc/vsftpd/vsftpd-virtual-user.db")
    (options, args) = parser.parse_args(sys.argv)
    return options


def get_homedir():
    """ Get user home directory from vsftpd.conf file, local_root parameter """
    f = open("/etc/vsftpd/vsftpd.conf", "r")
    for line in f:
        if line[0:10] == "local_root":
            # Example line:
            # local_root=/home/vftp/$USER
            home_dir = line.split("=")[1].split("$")[0]
            break
    f.close()

    return home_dir


def create_directory(username):
    """ Creates home directory for given username """
    home_dir = get_homedir()
    if home_dir:
        try:
            home_dir += username
            os.mkdir(home_dir, 0o700)
            uid = getpwnam('ftp').pw_uid
            gid = getpwnam('ftp').pw_gid
            os.chown(home_dir, uid, gid)
            print(home_dir + " is created...")
        except:
            print(home_dir + " was not created...")
    else:
        print("You must define local_root in the vsftpd.conf file...")


def remove_directory(username):
    """ Removes home directory for given username """
    home_dir = get_homedir()
    if home_dir:
        try:
            home_dir += username
            shutil.rmtree(home_dir)
            print(home_dir + " was removed...")
        except:
            print(home_dir + " was NOT removed...")
    else:
        print("You must define local_root in the vsftpd.conf file...")


def add_user(username, password, filename):
    """Add a new user or update an existing user"""
    action = "added"
    try:
        db = bsddb.hashopen(filename, 'c')
        if username in db:
            action = "updated"
        db[username] = password
        db.close()
        print(username + " was " + action + " successfully...")
    except:
        print("Cannot add or update database... ")

    if action == "added":
        create_directory(username)


def delete_user(username, filename, rem_dir):
    """Delete existing user"""
    try:
        db = bsddb.hashopen(filename, 'c')
        if username in db:
            db.pop(username)
            db.close()
            print("Username " + username + " was deleted successfully...")
        else:
            print("No such user " + username)
    except:
        print("Cannot delete from database...")

    if rem_dir:
        remove_directory(username)
    else:
        print("Not removing home directory...")


def show_database(filename):
    """ Show database contents. (Usernames and passwords) """
    try:
        db = bsddb.hashopen(filename, 'r')
    except:
        print("Cannot open database")
        return

    for k, v in db.items():
        print(k + " : " + v)


def main():
    """ main function """
    options = parse_args()
    filename = options.bsddb_file
    username = options.username
    del_user = options.del_user
    password = options.password
    showdb = options.showdb
    rem_dir = options.rem_dir

    if username and del_user:
        print("You cannot add and delete user at the same time!...")
        exit(1)
    elif not username and not del_user and not showdb:
        print("You must add or delete user or show db contents")
        exit(2)

    if username:
        add_user(username, password, filename)
    elif del_user:
        delete_user(del_user, filename, rem_dir)
    elif showdb:
        show_database(filename)


if __name__ == '__main__':
    main()
