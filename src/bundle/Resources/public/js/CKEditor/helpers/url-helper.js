const getSplitedUrl = (url) => {
    const splitedUrl = url.split('?');

    return {
        baseUrl: splitedUrl[0],
        queryString: splitedUrl[1],
    };
};

const decodeUrlQuery = (url) => {
    const { baseUrl, queryString } = getSplitedUrl(url);

    if (!queryString) {
        return url;
    }

    return `${baseUrl}?${decodeURI(queryString)}`;
};

const encodeUrlQuery = (url) => {
    const { baseUrl, queryString } = getSplitedUrl(url);

    if (!queryString) {
        return url;
    }

    return `${baseUrl}?${encodeURI(queryString)}`;
};

export { decodeUrlQuery, encodeUrlQuery };
