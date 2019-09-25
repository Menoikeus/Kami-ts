![inhouse games](https://i.imgur.com/7ONlAAU.png)
# Kami.ts
A Discord bot for League inhouses made with TypeScript

![inhouse games](https://i.imgur.com/UmgpZPc.png)

## What is Kami.ts?
Kami.ts is a project built on Node.js and TypeScript designed to facilitate creating inhouse matches for League of Legends. More than that, it allows for the creation of private ranked leagues for individual servers, server-specific tracked stats and elo for players, and automatic match detection, registration, processing, and display via Riot's LoL API.

## How do I add it to my server?
Add it to your server by going to the link here: https://discordapp.com/oauth2/authorize?client_id=309896040277082113&scope=bot and adding it to a server you are authorized to do it on.

## What permissions do I need?
None, but the permission to edit and remove messages will allow Kami.ts to clean up extraneous messages.

## What commands can I use?
A list of commands is here:


<pre><code><b>k!inhouse:</b>
 Shows this help screen
<b>k!inhouse league:</b>
 Shows the info about this server's inhouse league.
<b>k!inhouse add SUMMONER:</b>
 Creates an inhouse profile on this server, tied to the specified summoner.
<b>k!inhouse reassign SUMMONER:</b>
 Links your inhouse profile to a different summoner, if you already have an inhouse profile.
<b>k!inhouse profile DISCORD_USERNAME:</b>
 Views your inhouse profile, or the specified discord user's profile.
<b>k!inhouse game start:</b>
 Starts watching the inhouse game you are currently in.
<b>k!inhouse game [MATCHID | "recent"]:</b>
 Shows the game sats for the game with the given match id, or the most recent game.
<b>k!inhouse games PAGE_NUMBER:</b>
 Shows the most recent 5 games. Specify a page number (starting from 1) to get later games.
<b>k!inhouse watch:</b>
 Makes it so Kami watches and records any valid inhouse match that you're in automatically 
 (without having to call !inhouse start). Only works if your game activity is set to 'shown' in Discord.
<b>k!inhouse unwatch:</b>
 Undoes !inhouse watch, so that your inhouse games are no longer automatically recorded.
</code></pre>

## Images

![profile](https://i.imgur.com/pKAgmqK.png)
![league](https://i.imgur.com/wUuqgfS.png)
![game watching](https://i.imgur.com/jNH4DAd.png)

## What's to come?
If there's enough interest, I'm working on adding more features such as a website to display each server's ranked league completw with OAuth, as well as a slew of admin features and customization to both leagues and players.
