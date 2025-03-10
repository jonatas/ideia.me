---
title: "SSH connection refused"
layout: post
description: "When I'm playing with my Raspberry Pi, I install a new version of the system, and then ssh does not work. I'm constantly googling around this, and here are m..."
---
When I'm playing with my Raspberry Pi, I install a new version of the system, and then ssh does not work. I'm constantly googling around this, and here are my steps to check it. Look at the error:

```
ssh jonatas@rpi
ssh: connect to host rpi port 22: Connection refused
```

Let's see what we can do to overcome it.

## Configuring `/etc/hosts` for fun

It's a bit out of topic, but I love to share how I organize my development environment, and the first tip is: use `/etc/hosts` to map IPs that you use often.

Here is my `rpi` name pointing to my Raspberry Pi  IP in the local network:

```
grep rpi /etc/hosts
192.168.53.156  rpi
```

At my Raspberry Pi, I already have used `sudo apt install openssh-server`, but when I try to connect, this is what I get:


Checking the network with simple ping:

```
ping rpi 
PING rpi (192.168.53.156): 56 data bytes
64 bytes from 192.168.53.156: icmp_seq=0 ttl=64 time=19.967 ms
64 bytes from 192.168.53.156: icmp_seq=1 ttl=64 time=18.345 ms
```

## Checking what is the SSH Port configured in your Raspberry

On the Raspberry Pi, the first step is to check the ssh configuration port.
It's a file `/etc/ssh/ssh_config`, and we're going to use the `grep` command again to search for `Port`:

```
grep Port /etc/ssh/ssh_config
#   Port 22
```

If the port is commented like in my case, starting with `#`, that means it's
using the default port. If you have like `Port  221`, probably you should
consider adding `-p 221` to your ssh command.

## Checking SSH service status

Now, let's understand the why. `sudo service <name> status` can help to understand what's going on:

```
sudo service ssh status
```

Checking the output:

```
Process: 2916 ExecStart=/usr/sbin/sshd -D $SSHD_OPTS (code=exited, status=0/SUCCESS)
  Process: 2915 ExecStartPre=/usr/sbin/sshd -t (code=exited, status=0/SUCCESS)
 Main PID: 2916 (code=exited, status=0/SUCCESS)
mai 21 15:35:33 rpi-3 sshd[2922]: error: Could not load host key: /etc/ssh/ssh_host_ecdsa_key
mai 21 15:35:33 rpi-3 sshd[2922]: error: Could not load host key: /etc/ssh/ssh_host_ed25519_key
mai 21 15:35:33 rpi-3 sshd[2922]: fatal: No supported key exchange algorithms [preauth]
mai 21 15:36:09 rpi-3 sshd[2925]: error: Could not load host key: /etc/ssh/ssh_host_rsa_key
mai 21 15:36:09 rpi-3 sshd[2925]: error: Could not load host key: /etc/ssh/ssh_host_ecdsa_key
mai 21 15:36:09 rpi-3 sshd[2925]: error: Could not load host key: /etc/ssh/ssh_host_ed25519_key
mai 21 15:36:09 rpi-3 sshd[2925]: fatal: No supported key exchange algorithms [preauth]
mai 21 15:36:31 rpi-3 systemd[1]: Stopping OpenBSD Secure Shell server...
mai 21 15:36:31 rpi-3 sshd[2916]: Received signal 15; terminating.
mai 21 15:36:31 rpi-3 systemd[1]: Stopped OpenBSD Secure Shell server.
```

A `fatal` error in the output!


It means that it does not have the initial credentials in the machine. Let's add
it with `ssh-keygen -A`:

```
sudo ssh-keygen -A
ssh-keygen: generating new host keys: RSA DSA
ECDSA ED25519
```
Done! Now let's restart the ssh service:

```
sudo service ssh restart
```

Rechecking the service status:

```
sudo service ssh status
● ssh.service - OpenBSD Secure Shell server
   Loaded: loaded (/lib/systemd/system/ssh.service; enabled; vendor preset: enabled)
   Active: active (running) since Fri 2021-05-21 15:42:57 -03; 2s ago
  Process: 2101 ExecReload=/bin/kill -HUP $MAINPID (code=exited, status=0/SUCCESS)
  Process: 2095 ExecReload=/usr/sbin/sshd -t (code=exited, status=0/SUCCESS)
  Process: 3405 ExecStartPre=/usr/sbin/sshd -t (code=exited, status=0/SUCCESS)
 Main PID: 3406 (sshd)
    Tasks: 1 (limit: 2029)
   CGroup: /system.slice/ssh.service
           └─3406 /usr/sbin/sshd -D

mai 21 15:42:57 rpi-3 systemd[1]: Starting OpenBSD Secure Shell server...
mai 21 15:42:57 rpi-3 sshd[3406]: Server listening on 0.0.0.0 port 22.
mai 21 15:42:57 rpi-3 sshd[3406]: Server listening on :: port 22.
mai 21 15:42:57 rpi-3 systemd[1]: Started OpenBSD Secure Shell server.
```

Now it works! 🚀
