const express = require('express');
const app = express();

function calculateChecksum(idNumber) {
  const coefficients = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checksumCharacters = '10X98765432';
  let total = 0;
  for (let i = 0; i < 17; i++) {
    if (!isNaN(idNumber[i])) {
      total += idNumber[i] * coefficients[i];
    } else {
      return "身份证号码的前17位必须为数字";
    }
  }
  return checksumCharacters[total % 11];
}

function validateIdNumber(idNumber) {
  if (idNumber.length !== 18) {
    return "身份证号码必须为18位";
  }
  const birthDate = idNumber.substring(6, 14);
  const year = parseInt(birthDate.substring(0, 4), 10);
  const month = parseInt(birthDate.substring(4, 6), 10);
  const day = parseInt(birthDate.substring(6, 8), 10);

  const isValidDate = !isNaN(Date.parse(`${year}-${month}-${day}`));
  if (!isValidDate) {
    return "身份证号码中的出生日期无效";
  }
  const checksum = calculateChecksum(idNumber);
  if (checksum.length > 1) {
    return checksum;
  }
  return idNumber[17].toUpperCase() === checksum ? true : "身份证号码校验码错误";
}

function replaceUnknowns(idNumber, name, pos = 0) {
  if (pos === idNumber.length) {
    const validationResult = validateIdNumber(idNumber);
    return validationResult === true ? [[idNumber, name]] : [];
  }
  if (idNumber[pos] === 'B' || idNumber[pos] === 'b') {
    let validIds = [];
    for (let digit = 0; digit <= 9; digit++) {
      const newId = idNumber.substring(0, pos) + digit + idNumber.substring(pos + 1);
      validIds = validIds.concat(replaceUnknowns(newId, name, pos + 1));
    }
    if (pos === 17) {
      const newId = idNumber.substring(0, pos) + 'X' + idNumber.substring(pos + 1);
      validIds = validIds.concat(replaceUnknowns(newId, name, pos + 1));
    }
    return validIds;
  } else {
    return replaceUnknowns(idNumber, name, pos + 1);
  }
}

function filterByGender(idNumbers, gender) {
  if (gender !== '男' && gender !== '女') {
    return "性别必须为'男'或'女'";
  }
  const filteredIds = idNumbers.filter(([idNumber]) => {
    const lastDigit = parseInt(idNumber[16], 10);
    return (gender === '男' && lastDigit % 2 !== 0) || (gender === '女' && lastDigit % 2 === 0);
  });
  if (filteredIds.length === 0) {
    return "没有符合性别条件的身份证号码";
  }
  return filteredIds;
}

function processId(name, sfz, xingbie) {
  const validIds = replaceUnknowns(sfz, name);
  if (validIds.length === 0) {
    return '身份证号码无效，无法生成有效的身份证';
  }
  const filteredIds = filterByGender(validIds, xingbie);
  if (typeof filteredIds === 'string') {
    return filteredIds;
  }
  const results = filteredIds.map(([idNumber, n]) => {
    const validationResult = validateIdNumber(idNumber);
    return validationResult === true
      ? `${name} | ${idNumber}`
      : `${name} | ${idNumber} 无效: ${validationResult}`;
  });
  return results.join('<br>');
}

app.get('/api/id_process', (req, res) => {
  const name = req.query.name;
  const sfz = req.query.sfz;
  const xingbie = req.query.xb;

  if (!name || !sfz || !xingbie) {
    res.status(400).send('缺少参数');
    return;
  }

  const result = processId(name, sfz, xingbie);
  res.send(result);
});

module.exports = app;
