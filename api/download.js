const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

module.exports = (req, res) => {
  const { videoId, type, quality } = req.query;

  if (!videoId) {
    return res.status(400).send('Missing videoId');
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  let filename = videoId;

  // Add error handling and logging
  const onError = (err) => {
    console.error('Download error:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Error processing download: ' + err.message);
    }
  };

  if (type === 'mp4') {
    filename += '.mp4';
    const ytdlOptions = {
      filter: 'audioandvideo',
      quality: quality === '720p' ? 'highestvideo' : 'lowestvideo'  // highestvideo ≈720p or better, lowestvideo ≈360p
    };

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    ytdl(url, ytdlOptions)
      .on('error', onError)
      .pipe(res);
  } else if (type === 'mp3') {
    filename += '.mp3';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    const audioStream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio'
    }).on('error', onError);

    ffmpeg(audioStream)
      .audioCodec('libmp3lame')
      .audioBitrate(128)  // You can change to 192 or 320 if needed
      .format('mp3')
      .on('error', onError)
      .pipe(res, { end: true });
  } else {
    res.status(400).send('Invalid type. Use mp4 or mp3');
  }
};