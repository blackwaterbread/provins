# Provins
Manage your mod list for Arma Reforger with ease.

<img width="960" alt="image" src="https://github.com/user-attachments/assets/1cd4292a-43b4-4174-aa0a-7051be9b464b">

## Featues
* Check for updated mods
* Check for unavailable mods
* Edit and save configuration right away

## Installation
### Recommend
Follow the [Release](https://github.com/blackwaterbread/provins/releases) to download the binary for your environment

### Manual
```
> git clone https://github.com/blackwaterbread/provins
> yarn install (or npm install)
> yarn build (or npm install)
```

## Usage
```
> provins json_path options
```
### Binary (Windows)
```
> ./provins-win-x64.exe your-settings.json
```
### Binary (Linux)
```
> chmod +x provins-linux-x64
> provins-linux-x64 your-settings.json
```
### Binary (macOS)
* Trust provins app at the settings
```
> ./provins-macos-x64 your-settings.json
```
### Manual
```
> node provins.js your-settings.json
```

## Options
* -y, --yes | don't ask when modifying json (default: false)