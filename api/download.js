const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

module.exports = (req, res) => {
  const { videoId, type, quality } = req.query;

  if (!videoId) {
    res.status(400).send('Missing videoId');
    return;
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  let filename = videoId;

  if (type === 'mp4') {
    filename += '.mp4';
    const ytdlOptions = {
      filter: 'audioandvideo',
      quality: quality === '720p' ? 'highestvideo' : 'lowestvideo'
    };
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    ytdl(url, ytdlOptions).pipe(res);
  } else if (type === 'mp3') {
    filename += '.mp3';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    const audioStream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio'
    });

    ffmpeg(audioStream)
      .audioCodec('libmp3lame')
      .format('mp3')
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        res.status(500).send('Error converting to MP3');
      })
      .pipe(res, { end: true });
  } else {
    res.status(400).send('Invalid type');
  }
};