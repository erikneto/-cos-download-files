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

    contents.forEach(async (content) => {
        const fileParams = {
            Bucket: bucketName,
            Key: content.Key
        } 

        try {
            await createFile(fileParams, content);
        } catch (err) {
            throw new Error('Erro ao criar os arquivos na pasta: ', err);
        }
    });
};

async function createFile(fileParams, content) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    const file = fs.createWriteStream(`${folder}/${content.Key}`);

    await cos.getObject(fileParams).createReadStream().pipe(file);
}

async function main() {
    updateCosConfig();

    try {
        await listObjects(bucketName);
    } catch (err) {
        console.log('Erro ao baixar os objetos do bucket: ', err);
    }
}

main();