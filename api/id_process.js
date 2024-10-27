export default async function handler(req, res) {
    const { name, sfz, xb: xingbie, type } = req.method === 'POST' ? req.body : req.query;

    // 校验传入参数
    if (!name || !sfz || !xingbie) {
        return res.status(400).json({ code: 0, msg: '缺少参数' });
    }

    // 计算校验位
    function calculateChecksum(idNumber) {
        const coefficients = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        const checksumCharacters = '10X98765432';
        let total = 0;

        for (let i = 0; i < 17; i++) {
            if (isNaN(idNumber[i])) {
                return res.status(400).json({ code: 0, msg: '身份证号码的前17位必须为数字' });
            }
            total += idNumber[i] * coefficients[i];
        }

        return checksumCharacters[total % 11];
    }

    // 校验身份证号码
    function validateIdNumber(idNumber) {
        if (idNumber.length !== 18) {
            return res.status(400).json({ code: 0, msg: '身份证号码必须为18位' });
        }

        const birthDate = idNumber.substr(6, 8);
        const year = birthDate.substr(0, 4);
        const month = birthDate.substr(4, 2);
        const day = birthDate.substr(6, 2);

        const date = new Date(`${year}-${month}-${day}`);
        if (date.getFullYear() != year || date.getMonth() + 1 != month || date.getDate() != day) {
            return res.status(400).json({ code: 0, msg: '身份证号码中的出生日期无效' });
        }

        const checksum = calculateChecksum(idNumber);
        return idNumber[17].toUpperCase() === checksum;
    }

    // 替换未知字符
    function replaceUnknowns(idNumber, name, pos = 0) {
        if (pos === idNumber.length) {
            return validateIdNumber(idNumber) ? [[idNumber, name]] : [];
        }

        if (idNumber[pos] === 'B' || idNumber[pos] === 'b') {
            let validIds = [];
            for (let digit = 0; digit <= 9; digit++) {
                let newId = idNumber.substring(0, pos) + digit + idNumber.substring(pos + 1);
                validIds = validIds.concat(replaceUnknowns(newId, name, pos + 1));
            }
            if (pos === 17) {
                let newId = idNumber.substring(0, pos) + 'X' + idNumber.substring(pos + 1);
                validIds = validIds.concat(replaceUnknowns(newId, name, pos + 1));
            }
            return validIds;
        } else {
            return replaceUnknowns(idNumber, name, pos + 1);
        }
    }

    // 过滤性别
    function filterByGender(idNumbers, gender) {
        if (gender !== '男' && gender !== '女') {
            return res.status(400).json({ code: 0, msg: "性别必须为'男'或'女'" });
        }

        const filteredIds = idNumbers.filter(([idNumber]) => {
            const lastDigit = parseInt(idNumber[16]);
            return (gender === '男' && lastDigit % 2 !== 0) || (gender === '女' && lastDigit % 2 === 0);
        });

        if (filteredIds.length === 0) {
            return res.status(400).json({ code: 0, msg: '没有符合性别条件的身份证号码' });
        }

        return filteredIds;
    }

    // 处理身份证
    function processId(name, sfz, xingbie) {
        let validIds = replaceUnknowns(sfz, name);
        if (validIds.length === 0) {
            return res.status(400).json({ code: 0, msg: '身份证号码无效，无法生成有效的身份证' });
        }

        let filteredIds = filterByGender(validIds, xingbie);
        if (filteredIds.length === 0) {
            return res.status(400).json({ code: 0, msg: '没有符合性别条件的身份证号码' });
        }

        // 检查 type 参数并返回不同的格式
        if (type === 'text') {
            const idNumbers = filteredIds.map(([idNumber]) => idNumber).join('\n');
            res.status(200).send(idNumbers);
        } else {
            const resultArray = filteredIds.map(([idNumber, name]) => ({ name, idCard: idNumber }));
            res.status(200).json({ code: 200, data: resultArray });
        }
    }

    // 调用处理函数
    processId(name, sfz, xingbie);
}
