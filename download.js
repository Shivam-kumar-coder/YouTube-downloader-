// api/download.js
const ytdl = require('ytdl-core');

export default async function handler(req, res) {
    const { url, format } = req.query;

    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
        
        if (format === 'mp3') {
            res.setHeader('Content-type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
            ytdl(url, { format: 'mp3', filter: 'audioonly', quality: 'highestaudio' }).pipe(res);
        } else {
            res.setHeader('Content-type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
            ytdl(url, { format: 'mp4', quality: 'highestvideo', filter: 'audioandvideo' }).pipe(res);
        }
    } catch (err) {
        res.status(500).json({ error: 'Error processing video' });
    }
}
