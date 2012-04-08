# github-growl 

Cross-platform desktop notifications for your Github repositories.

Currently supports Mac OS X (Darwin), Ubuntu (Linux), and Windows.

## Requirements

1. Download the growl equivalent for your OS:
  * Mac OS X: [growlnotify][1]
  * Ubuntu: `sudo apt-get install libnotify-bin`
  * Windows: [Growl for Windows][2] and [growlnotify][3]**&#42;**

**&#42;** = unpack to a folder present in your path

[1]: http://growl.info/extras.php#growlnotify
[2]: http://www.growlforwindows.com/gfw/default.aspx
[3]: http://www.growlforwindows.com/gfw/help/growlnotify.aspx

2. Then install the CLI package for `github-growl`:

```bash
npm install -g github-growl
```

## Example Usage

```bash
github-growl [options]
```

## Events Supported

**NOTE**: This is a work in progress, so we add more to this list:

* IssueCommentEvent

## Help

```bash
github-growl -h
```

## Development

```bash
chmod +x bin/github-growl
bin/github-growl
```

## Contributors

* Nick Baugh <niftylettuce@gmail.com>

## License

MIT Licensed
