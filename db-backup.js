const nodemailer = require("nodemailer");

require("dotenv").config();
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

function createBackupFolder() {
  const now = new Date();

  const month = now.toLocaleString("en-US", {
    month: "long",
  });

  const dateFolder =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");

  const backupPath = path.join(process.env.BACKUP_PATH, month, dateFolder);

  fs.mkdirSync(backupPath, { recursive: true });

  console.log("Folder Created:", backupPath);

  return backupPath;
}

async function sendEmail(subject, htmlBody) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_MAIL_FROM,
    to: process.env.EMAIL_TO,
    cc: process.env.EMAIL_CC,
    subject,
    html: htmlBody,
  });
}

(async () => {
  try {
    const backupFolder = createBackupFolder();

    console.log("Backup Folder:", backupFolder);

    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    console.log("Opening login page...");

    await page.goto(process.env.LOGIN_URL, {
      waitUntil: "networkidle",
    });

    console.log("USERNAME =", process.env.LOGIN_EMAIL);

    await page.fill("#exampleUsername", process.env.LOGIN_EMAIL);
    await page.fill("#examplePassword", process.env.LOGIN_PASSWORD);

    await page.click('button:has-text("Login")');

    await page.waitForLoadState("networkidle", {
      timeout: 300000,
    });

    console.log("Current URL:", page.url());

    if (page.url() === process.env.LOGIN_URL) {
      throw new Error("Login failed. Please check your login credentials.");
    }

    // Example backup endpoints.
    // Replace these with your application's backup URLs.
    const backupUrls = [
      `${process.env.BASE_URL}/db-backup-1`,
      `${process.env.BASE_URL}/db-backup-2`,
      `${process.env.BASE_URL}/db-backup-3`,
    ];

    let count = 0;

    for (const url of backupUrls) {
      console.log("Opening:", url);

      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 300000,
      });

      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 300000 }),
        page.click('a:has-text("Click here")'),
      ]);

      const filePath = path.join(backupFolder, download.suggestedFilename());

      await download.saveAs(filePath);

      count++;
      console.log(`Downloaded ${count}/${backupUrls.length}`);

      await page.waitForTimeout(2000);

      console.log("Downloaded:", filePath);
    }

    await page.screenshot({
      path: "db-backup-success.png",
      fullPage: true,
    });

    console.log("Database backup completed successfully.");

    await page.waitForTimeout(5000);

    await sendEmail(
      "Automation of The Database Backup System - Database Backup Successfully",
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; margin: 0; padding: 0;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 600px; width: 100%;">
                <!-- Header -->
                <tr>
                  <td style="border-bottom: 3px solid #2c3e50; padding: 0 0 15px 0; margin: 0 0 25px 0;">
                    <h1 style="font-size: 22px; color: #2c3e50; margin: 0; font-weight: bold;">Database Backup Report</h1>
                    <p style="color: #7f8c8d; font-size: 14px; margin: 5px 0 0 0;">Automation of The Database Backup System</p>
                  </td>
                </tr>
                
                <!-- Greeting -->
                <tr>
                  <td style="padding: 20px 0 10px 0;">
                    <p style="font-size: 16px; color: #333333; margin: 0;">Dear Team,</p>
                  </td>
                </tr>
                
                <!-- Message -->
                <tr>
                  <td style="padding: 10px 0 20px 0;">
                    <p style="font-size: 15px; color: #333333; margin: 0;">This is to inform you that the scheduled database backup process has completed successfully.</p>
                  </td>
                </tr>
                
                <!-- Table -->
                <tr>
                  <td style="padding: 10px 0 20px 0;">
                    <table width="100%" cellpadding="8" cellspacing="0" border="1" style="border-collapse: collapse; font-size: 14px; border: 1px solid #dee2e6;">
                      <thead>
                        <tr>
                          <th style="background-color: #f8f9fa; text-align: left; padding: 10px 12px; border: 1px solid #dee2e6; font-weight: bold; color: #2c3e50;">Backup Name</th>
                          <th style="background-color: #f8f9fa; text-align: left; padding: 10px 12px; border: 1px solid #dee2e6; font-weight: bold; color: #2c3e50;">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="padding: 10px 12px; border: 1px solid #dee2e6;">DB-Backup 1</td>
                          <td style="padding: 10px 12px; border: 1px solid #dee2e6; color: #27ae60; font-weight: bold;">✓ Success</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 12px; border: 1px solid #dee2e6;">DB-Backup 2</td>
                          <td style="padding: 10px 12px; border: 1px solid #dee2e6; color: #27ae60; font-weight: bold;">✓ Success</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 12px; border: 1px solid #dee2e6;">DB-Backup 3</td>
                          <td style="padding: 10px 12px; border: 1px solid #dee2e6; color: #27ae60; font-weight: bold;">✓ Success</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
                
                <!-- Summary -->
                <tr>
                  <td style="padding: 15px 0; border-top: 1px solid #dee2e6; border-bottom: 1px solid #dee2e6;">
                    <table width="100%" cellpadding="4" cellspacing="0" border="0">
                      <tr>
                        <td style="color: #7f8c8d; font-size: 14px; padding: 6px 0;">Total Files Downloaded</td>
                        <td style="font-weight: bold; color: #2c3e50; font-size: 14px; padding: 6px 0; text-align: right;">${count}/${backupUrls.length}</td>
                      </tr>
                      <tr>
                        <td style="color: #7f8c8d; font-size: 14px; padding: 6px 0;">Backup Location</td>
                        <td style="font-weight: bold; color: #2c3e50; font-size: 13px; padding: 6px 0; text-align: right;">${backupFolder}</td>
                      </tr>
                      <tr>
                        <td style="color: #7f8c8d; font-size: 14px; padding: 6px 0;">Execution Time</td>
                        <td style="font-weight: bold; color: #2c3e50; font-size: 14px; padding: 6px 0; text-align: right;">${new Date().toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="color: #7f8c8d; font-size: 14px; padding: 6px 0;">Status</td>
                        <td style="font-weight: bold; color: #27ae60; font-size: 14px; padding: 6px 0; text-align: right;">SUCCESS</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Info Box -->
                <tr>
                  <td style="padding: 20px 0 10px 0;">
                    <table width="100%" cellpadding="12" cellspacing="0" border="0" style="background-color: #f8f9fa; border-left: 4px solid #2c3e50;">
                      <tr>
                        <td style="font-size: 14px; color: #333333;">
                          <strong>ℹ️ Note:</strong> This is an automated notification generated by the Automation of The Database Backup System.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 0 0 0; border-top: 1px solid #dee2e6; margin-top: 30px;">
                    <p style="font-size: 13px; color: #7f8c8d; margin: 0 0 10px 0;">This email was sent automatically. Please do not reply to this message.</p>
                    <p style="font-size: 13px; color: #2c3e50; margin: 0;">
                      <strong>Regards,</strong><br>
                      Automation of The Database Backup System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    );

    await browser.close();
  } catch (error) {
    try {
      await sendEmail(
        "Automation of The Database Backup System - Database Backup Failed",
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; margin: 0; padding: 0;">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 600px; width: 100%;">
                  <!-- Header -->
                  <tr>
                    <td style="border-bottom: 3px solid #c0392b; padding: 0 0 15px 0; margin: 0 0 25px 0;">
                      <h1 style="font-size: 22px; color: #c0392b; margin: 0; font-weight: bold;">⚠️ Database Backup Failed</h1>
                      <p style="color: #7f8c8d; font-size: 14px; margin: 5px 0 0 0;">Automation of The Database Backup System</p>
                    </td>
                  </tr>
                  
                  <!-- Message -->
                  <tr>
                    <td style="padding: 10px 0 20px 0;">
                      <p style="font-size: 15px; color: #333333; margin: 0;">The scheduled database backup process has encountered an error and could not complete successfully.</p>
                    </td>
                  </tr>
                  
                  <!-- Error Box -->
                  <tr>
                    <td style="padding: 10px 0 20px 0;">
                      <table width="100%" cellpadding="15" cellspacing="0" border="0" style="background-color: #fdf2f2; border-left: 4px solid #c0392b; border-radius: 3px;">
                        <tr>
                          <td>
                            <p style="font-weight: bold; color: #c0392b; margin: 0 0 5px 0; font-size: 14px;">Error Details</p>
                            <div style="font-family: 'Courier New', monospace; font-size: 13px; color: #2c3e50; background-color: #ffffff; padding: 10px; border: 1px solid #e74c3c; word-break: break-word; border-radius: 3px;">${error.message}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Summary -->
                  <tr>
                    <td style="padding: 15px 0; border-top: 1px solid #dee2e6; border-bottom: 1px solid #dee2e6;">
                      <table width="100%" cellpadding="4" cellspacing="0" border="0">
                        <tr>
                          <td style="color: #7f8c8d; font-size: 14px; padding: 6px 0;">Time of Failure</td>
                          <td style="font-weight: bold; color: #2c3e50; font-size: 14px; padding: 6px 0; text-align: right;">${new Date().toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td style="color: #7f8c8d; font-size: 14px; padding: 6px 0;">Status</td>
                          <td style="font-weight: bold; color: #c0392b; font-size: 14px; padding: 6px 0; text-align: right;">FAILED</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Action Required Box -->
                  <tr>
                    <td style="padding: 20px 0 10px 0;">
                      <table width="100%" cellpadding="12" cellspacing="0" border="0" style="background-color: #f8f9fa; border-left: 4px solid #7f8c8d;">
                        <tr>
                          <td style="font-size: 14px; color: #333333;">
                            <strong>ℹ️ Action Required:</strong> Please check the system logs and investigate the cause of this failure. The backup process may need to be restarted manually.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 0 0 0; border-top: 1px solid #dee2e6; margin-top: 30px;">
                      <p style="font-size: 13px; color: #7f8c8d; margin: 0 0 10px 0;">This is an automated notification generated by the Automation of The Database Backup System.</p>
                      <p style="font-size: 13px; color: #2c3e50; margin: 0;">
                        <strong>Regards,</strong><br>
                        Automation of The Database Backup System 
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `,
      );
    } catch (emailError) {
      console.error("Failed to send failure email:", emailError);
    }
    console.error("ERROR:", error);
  }
})();
