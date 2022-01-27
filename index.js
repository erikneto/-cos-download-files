const fs = require('fs');
const IBMCos = require('ibm-cos-sdk');
require('dotenv').config();

const bucketName = process.env.BUCKET_NAME || '';
const folder = `./${process.env.FOLDER}` || './downloads';

function updateCosConfig() {
    cosConfig = {
        endpoint: process.env.COS_ENDPOINT,
        apiKeyId: process.env.COS_APIKEY,
        ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
        serviceInstanceId: process.env.COS_RESOURCEID
    };

    cos = new IBMCos.S3(cosConfig);
}

async function listObjects(bucketName) {
    const listObjects = await cos.listObjects({ Bucket: bucketName }).promise();

    const contents = listObjects.Contents;

    contents.forEach(content => {
        const fileParams = {
            Bucket: bucketName,
            Key: content.Key
        } 

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        let file = fs.createWriteStream(`${folder}/${content.Key}`);

        return new Promise((resolve, reject) => {
            cos.getObject(fileParams).createReadStream()
                .on('end', () => {
                    return resolve();
                })
                .on('error', (error) => {
                    return reject(error);
                }).pipe(file);
        });
    });
};

async function main() {
    updateCosConfig();

    try {
        await listObjects(bucketName);
    } catch (err) {
        console.log('Erro ao baixar os objetos do bucket', err);
    }
}

main();