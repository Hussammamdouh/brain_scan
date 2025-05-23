const fs = require('fs');
const path = require('path');
const Scan = require('../models/Scan');
const sendEmail = require('../utils/sendEmail');
const { analyzeBrainScan } = require('../utils/geminiService');

exports.uploadScan = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        const imagePath = req.file.path;
        const userId = req.user._id;

        // Read the image file and convert to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Get AI analysis from Gemini
        const analysis = await analyzeBrainScan(base64Image);

        const scan = new Scan({
            user: userId,
            imageUrl: imagePath,
            diagnosisResult: analysis.analysis,
            confidence: analysis.confidence,
            analysisTimestamp: analysis.timestamp
        });

        await scan.save();

        // Send Notification Email
        await sendEmail({
            email: req.user.email,
            subject: 'Your BrainScan Analysis is Ready!',
            message: `
Hello ${req.user.firstName},

Your brain scan has been analyzed by our AI system.

Analysis Results:
${analysis.analysis}

Confidence Level: ${(analysis.confidence * 100).toFixed(1)}%

Thank you for using BrainScan!

Best regards,
BrainScan Team
            `
        });

        res.status(201).json({
            message: 'Scan uploaded and analyzed successfully.',
            scan: {
                id: scan._id,
                diagnosisResult: scan.diagnosisResult,
                confidence: scan.confidence,
                analysisTimestamp: scan.analysisTimestamp
            }
        });
    } catch (error) {
        console.error('Scan upload error:', error);
        res.status(500).json({ 
            message: 'Error processing scan',
            error: error.message 
        });
    }
};

// Get All Scans of the Logged-in User
exports.getMyScans = async (req, res) => {
    try {
        const scans = await Scan.find({ user: req.user._id })
            .select('-__v')
            .sort({ createdAt: -1 });
        res.status(200).json(scans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a Scan by ID
exports.deleteScan = async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id);

        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        // Make sure user owns this scan
        if (scan.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this scan' });
        }

        // Delete file from uploads folder
        const fs = require('fs');
        if (fs.existsSync(scan.imageUrl)) {
            fs.unlinkSync(scan.imageUrl); // Delete the image
        }

        await scan.deleteOne();

        res.status(200).json({ message: 'Scan deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Export Scans To PDF
exports.exportScanToPDF = async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id).populate('user');

        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        // Check user owns scan
        if (scan.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Create PDF
        const doc = new PDFDocument();
        const filename = `ScanReport_${scan._id}.pdf`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        // Title
        doc.fontSize(20).text('BrainScan Diagnosis Report', { align: 'center' });
        doc.moveDown();

        // User Info
        doc.fontSize(14).text(`Name: ${scan.user.firstName} ${scan.user.lastName}`);
        doc.text(`Email: ${scan.user.email}`);
        doc.text(`Date: ${scan.createdAt.toDateString()}`);
        doc.moveDown();

        // Diagnosis
        doc.fontSize(16).text('Diagnosis Result:', { underline: true });
        doc.fontSize(14).text(scan.diagnosisResult || 'No diagnosis available.');
        doc.moveDown();

        // Image (if file exists)
        const imagePath = path.resolve(scan.imageUrl);
        const fs = require('fs');
        if (fs.existsSync(imagePath)) {
            doc.addPage().image(imagePath, {
                fit: [500, 400],
                align: 'center',
                valign: 'center'
            });
        }

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

