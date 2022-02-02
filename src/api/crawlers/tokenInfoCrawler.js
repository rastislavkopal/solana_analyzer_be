// scraper.js
const cheerio = require("cheerio");
const axios = require("axios").default;

const fethHtml = async url => {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch {
    console.error(`ERROR: An error occurred while trying to fetch the URL: ${url}`);
  }
};

const extractDeal = selector => {
  const title = selector
    .find('#form-dialog-title')
    .find('h2 > b')
    .text()
    .trim();

  const attributes = selector
    .find('div.MuiDialogContent-root > p:nth-child(3) > div > div')
    .find("div[class='col search_released responsive_secondrow']")
    .text()
    .trim();

  // const link = selector.attr("href").trim();


  return {
    title,
    // releaseDate,
    // originalPrice,
    // discountedPrice,
    // link
  };
};

const scrapToken = async () => {
  const nftUrl = "https://solanart.io/search/?token=CYYrpK2ZoNWVxKd81L3H7aEyGRDmVAkCukoLv6yPmuGU";

  const html = await fethHtml(nftUrl);

  const selector = cheerio.load(html);

  const searchResults = selector("body").find(
    '#form-dialog-title > h2 > b'
  )
  .text()
  .trim();
  console.log(searchResults);

  // const deals = searchResults
  //   .map((idx, el) => {
  //     const elementSelector = selector(el);
  //     return extractDeal(elementSelector);
  //   })
  //   .get();

  // console.log(deals);
  return deals;
};

module.exports = scrapToken;
