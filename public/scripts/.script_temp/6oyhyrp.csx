formattedAmount = ethers.BigNumber.isBigNumber(amount)
            ? amount.toString() // Convert BigNumber to string
            : amount;
