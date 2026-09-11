/** © 2016 Nathan Rugg <nmrugg@gmail.com>
  * Code extracted from https://github.com/LZMA-JS/LZMA-JS
  *
  * Modified to decode complete xz streams rather than a single LZMA2 chunk.
  * The original `decompress()` skipped a hard-coded 29-byte prefix and ran the
  * LZMA1 core over the remainder in one pass. That is only correct when the xz
  * block holds exactly one LZMA2 chunk, and an LZMA2 chunk is capped at 2 MiB
  * uncompressed / 64 KiB compressed — so any larger ROOT buffer (an ATLAS ESD
  * `CollectionTree` is ~2.2 MB) failed with "corrupted input".
  *
  * The LZMA1 core below is untouched. What changed:
  *   - the xz stream/block header is parsed instead of assumed to be 29 bytes;
  *   - `decompress()` drives the LZMA2 chunk sequence, carrying decoder state
  *     and the dictionary window across chunks as the reset flags require;
  *   - the dictionary size comes from the block header instead of a fixed 8 MiB,
  *     and the window is a Uint8Array rather than a holey Array.
  *
  * See https://tukaani.org/xz/xz-file-format.txt sections 2.1, 3 and 5.3.1.
  *
  * phoenix-jsroot-lzma2-patch — marker used by scripts/patch-jsroot.js to tell
  * its own output apart from the pristine upstream file. */

const __4294967296 = 4294967296,
      P0_longLit = [0, 0],
      P1_longLit = [1, 0];

function initDim(len) {
   // This is MUCH faster than "new Array(len)" in newer versions of v8 (starting with Node.js 0.11.15, which uses v8 3.28.73).
   const a = [];
   a[len - 1] = undefined;
   return a;
}

function add(a, b) {
   return create(a[0] + b[0], a[1] + b[1]);
}

function compare(a, b) {
   if (a[0] === b[0] && a[1] === b[1])
      return 0;
   const nega = a[1] < 0,
         negb = b[1] < 0;
   if (nega && !negb)
      return -1;
   if (!nega && negb)
      return 1;
   if (sub(a, b)[1] < 0)
      return -1;
   return 1;
}

function create(valueLow, valueHigh) {
   valueHigh %= 1.8446744073709552E19;
   valueLow %= 1.8446744073709552E19;
   const diffHigh = valueHigh % __4294967296,
      diffLow = Math.floor(valueLow / __4294967296) * __4294967296;
   valueHigh = valueHigh - diffHigh + diffLow;
   valueLow = valueLow - diffLow + diffHigh;
   while (valueLow < 0) {
      valueLow += __4294967296;
      valueHigh -= __4294967296;
   }
   while (valueLow > 4294967295) {
      valueLow -= __4294967296;
      valueHigh += __4294967296;
   }
   valueHigh = valueHigh % 1.8446744073709552E19;
   while (valueHigh > 9223372032559808512)
      valueHigh -= 1.8446744073709552E19;
   while (valueHigh < -9223372036854775808)
      valueHigh += 1.8446744073709552E19;
   return [valueLow, valueHigh];
}

function fromInt(value) {
   if (value >= 0)
      return [value, 0];
   else
      return [value + __4294967296, -__4294967296];
}

function lowBits_0(a) {
   if (a[0] >= 2147483648)
      return ~~Math.max(Math.min(a[0] - __4294967296, 2147483647), -2147483648);
   else
      return ~~Math.max(Math.min(a[0], 2147483647), -2147483648);
}

function sub(a, b) {
   return create(a[0] - b[0], a[1] - b[1]);
}

function $ByteArrayInputStream(this$static, buf, offset) {
   this$static.buf = buf;
   this$static.pos = offset ?? 0;
   this$static.count = buf.length;
   return this$static;
}

function $read(this$static) {
   if (this$static.pos >= this$static.count)
      return -1;
   return this$static.buf[this$static.pos++]; //  & 255; not needed, input always uint8
}

function $ByteArrayOutputStream(this$static, buf) {
   this$static.buf = buf;
   this$static.count = 0;
   return this$static;
}

function $write_0(this$static, buf, off, len) {
   arraycopy(buf, off, this$static.buf, this$static.count, len);
   this$static.count += len;
}

function arraycopy(src, srcOfs, dest, destOfs, len) {
   for (let i = 0; i < len; ++i)
      dest[destOfs + i] = src[srcOfs + i];
}

function $CopyBlock(this$static, distance, len) {
   let pos = this$static._pos - distance - 1;
   if (pos < 0)
      pos += this$static._windowSize;

   for (; len; --len) {
      if (pos >= this$static._windowSize)
         pos = 0;

      this$static._buffer[this$static._pos++] = this$static._buffer[pos++];
      if (this$static._pos >= this$static._windowSize)
         $Flush_0(this$static);
   }
}

function $Create_5(this$static, windowSize) {
   // Uint8Array rather than initDim(): the window only ever holds bytes, and the
   // original allocated a holey Array of up to 8388608 elements on every call.
   if (!this$static._buffer || this$static._windowSize !== windowSize)
      this$static._buffer = new Uint8Array(windowSize);

   this$static._windowSize = windowSize;
   this$static._pos = 0;
   this$static._streamPos = 0;
}

function $Flush_0(this$static) {
   const size = this$static._pos - this$static._streamPos;
   if (!size)
      return;

   $write_0(this$static._stream, this$static._buffer, this$static._streamPos, size);
   if (this$static._pos >= this$static._windowSize)
      this$static._pos = 0;

   this$static._streamPos = this$static._pos;
}

function $GetByte(this$static, distance) {
   let pos = this$static._pos - distance - 1;
   if (pos < 0)
      pos += this$static._windowSize;

   return this$static._buffer[pos];
}

function $PutByte(this$static, b) {
   this$static._buffer[this$static._pos++] = b;
   if (this$static._pos >= this$static._windowSize)
      $Flush_0(this$static);
}

function GetLenToPosState(len) {
   len -= 2;
   return (len < 4) ? len : 3;
}

function StateUpdateChar(index) {
   if (index < 4)
      return 0;

   return index < 10 ? index - 3 : index - 6;
}

function $CodeOneChunk(this$static) {
   let decoder2, distance, len, numDirectBits, posSlot;
   const posState = lowBits_0(this$static.nowPos64) & this$static.m_PosStateMask;
   if (!$DecodeBit(this$static.m_RangeDecoder, this$static.m_IsMatchDecoders, (this$static.state << 4) + posState)) {
      decoder2 = $GetDecoder(this$static.m_LiteralDecoder, lowBits_0(this$static.nowPos64), this$static.prevByte);
      if (this$static.state < 7)
         this$static.prevByte = $DecodeNormal(decoder2, this$static.m_RangeDecoder);
      else
         this$static.prevByte = $DecodeWithMatchByte(decoder2, this$static.m_RangeDecoder, $GetByte(this$static.m_OutWindow, this$static.rep0));

      $PutByte(this$static.m_OutWindow, this$static.prevByte);
      this$static.state = StateUpdateChar(this$static.state);
      this$static.nowPos64 = add(this$static.nowPos64, P1_longLit);
   } else {
      if ($DecodeBit(this$static.m_RangeDecoder, this$static.m_IsRepDecoders, this$static.state)) {
         len = 0;
         if (!$DecodeBit(this$static.m_RangeDecoder, this$static.m_IsRepG0Decoders, this$static.state)) {
            if (!$DecodeBit(this$static.m_RangeDecoder, this$static.m_IsRep0LongDecoders, (this$static.state << 4) + posState)) {
               this$static.state = this$static.state < 7 ? 9 : 11;
               len = 1;
            }
         } else {
            if (!$DecodeBit(this$static.m_RangeDecoder, this$static.m_IsRepG1Decoders, this$static.state))
               distance = this$static.rep1;
            else {
               if (!$DecodeBit(this$static.m_RangeDecoder, this$static.m_IsRepG2Decoders, this$static.state))
                  distance = this$static.rep2;
               else {
                  distance = this$static.rep3;
                  this$static.rep3 = this$static.rep2;
               }
               this$static.rep2 = this$static.rep1;
            }
            this$static.rep1 = this$static.rep0;
            this$static.rep0 = distance;
         }
         if (!len) {
            len = $Decode(this$static.m_RepLenDecoder, this$static.m_RangeDecoder, posState) + 2;
            this$static.state = this$static.state < 7 ? 8 : 11;
         }
      } else {
         this$static.rep3 = this$static.rep2;
         this$static.rep2 = this$static.rep1;
         this$static.rep1 = this$static.rep0;
         len = 2 + $Decode(this$static.m_LenDecoder, this$static.m_RangeDecoder, posState);
         this$static.state = this$static.state < 7 ? 7 : 10;
         posSlot = $Decode_0(this$static.m_PosSlotDecoder[GetLenToPosState(len)], this$static.m_RangeDecoder);
         if (posSlot >= 4) {
            numDirectBits = (posSlot >> 1) - 1;
            this$static.rep0 = (2 | posSlot & 1) << numDirectBits;
            if (posSlot < 14)
               this$static.rep0 += ReverseDecode(this$static.m_PosDecoders, this$static.rep0 - posSlot - 1, this$static.m_RangeDecoder, numDirectBits);
            else {
               this$static.rep0 += $DecodeDirectBits(this$static.m_RangeDecoder, numDirectBits - 4) << 4;
               this$static.rep0 += $ReverseDecode(this$static.m_PosAlignDecoder, this$static.m_RangeDecoder);
               if (this$static.rep0 < 0) {
                  if (this$static.rep0 === -1)
                     return 1;

                  return -1;
               }
            }
         } else
            this$static.rep0 = posSlot;
      }
      if (compare(fromInt(this$static.rep0), this$static.nowPos64) >= 0 || this$static.rep0 >= this$static.m_DictionarySizeCheck)
         return -1;

      $CopyBlock(this$static.m_OutWindow, this$static.rep0, len);
      this$static.nowPos64 = add(this$static.nowPos64, fromInt(len));
      this$static.prevByte = $GetByte(this$static.m_OutWindow, 0);
   }
   return 0;
}

function $Decoder(this$static) {
   this$static.m_OutWindow = {};
   this$static.m_RangeDecoder = {};
   this$static.m_IsMatchDecoders = initDim(192);
   this$static.m_IsRepDecoders = initDim(12);
   this$static.m_IsRepG0Decoders = initDim(12);
   this$static.m_IsRepG1Decoders = initDim(12);
   this$static.m_IsRepG2Decoders = initDim(12);
   this$static.m_IsRep0LongDecoders = initDim(192);
   this$static.m_PosSlotDecoder = initDim(4);
   this$static.m_PosDecoders = initDim(114);
   this$static.m_PosAlignDecoder = $BitTreeDecoder({}, 4);
   this$static.m_LenDecoder = $Decoder$LenDecoder({});
   this$static.m_RepLenDecoder = $Decoder$LenDecoder({});
   this$static.m_LiteralDecoder = {};
   for (let i = 0; i < 4; ++i)
      this$static.m_PosSlotDecoder[i] = $BitTreeDecoder({}, 6);

   return this$static;
}

/** @summary Reset the probability models only.
  * @desc Was `$Init_1`, which also rewound the dictionary window and re-initialised
  * the range decoder. LZMA2 controls those three things independently: a chunk can
  * ask for a state reset while keeping the dictionary, and the range decoder is
  * re-initialised for every chunk regardless. */
function $InitProbs(this$static) {
   InitBitModels(this$static.m_IsMatchDecoders);
   InitBitModels(this$static.m_IsRep0LongDecoders);
   InitBitModels(this$static.m_IsRepDecoders);
   InitBitModels(this$static.m_IsRepG0Decoders);
   InitBitModels(this$static.m_IsRepG1Decoders);
   InitBitModels(this$static.m_IsRepG2Decoders);
   InitBitModels(this$static.m_PosDecoders);
   $Init_0(this$static.m_LiteralDecoder);
   for (let i = 0; i < 4; ++i)
      InitBitModels(this$static.m_PosSlotDecoder[i].Models);

   $Init(this$static.m_LenDecoder);
   $Init(this$static.m_RepLenDecoder);
   InitBitModels(this$static.m_PosAlignDecoder.Models);
}

/** @summary Apply an LZMA2 properties byte (packed lc/lp/pb).
  * @desc Was `$SetDecoderProperties`, which also forced an 8 MiB dictionary. The
  * dictionary size is a property of the xz block header, not of this byte, so it
  * is set once by `decompress()` instead. */
function $SetLcLpPbFromByte(this$static, val) {
   if (val === undefined || val > 224)
      return false;

   const lc = val % 9,
         remainder = ~~(val / 9),
         lp = remainder % 5,
         pb = ~~(remainder / 5);

   return !!$SetLcLpPb(this$static, lc, lp, pb);
}

function $SetDictionarySize(this$static, dictionarySize) {
   if (dictionarySize < 0)
      return 0;

   if (this$static.m_DictionarySize !== dictionarySize) {
      this$static.m_DictionarySize = dictionarySize;
      this$static.m_DictionarySizeCheck = Math.max(this$static.m_DictionarySize, 1);
      $Create_5(this$static.m_OutWindow, Math.max(this$static.m_DictionarySizeCheck, 4096));
   }
   return 1;
}

function $SetLcLpPb(this$static, lc, lp, pb) {
   if (lc > 8 || lp > 4 || pb > 4)
      return 0;

   $Create_0(this$static.m_LiteralDecoder, lp, lc);
   const numPosStates = 1 << pb;
   $Create(this$static.m_LenDecoder, numPosStates);
   $Create(this$static.m_RepLenDecoder, numPosStates);
   this$static.m_PosStateMask = numPosStates - 1;
   return 1;
}

function $Create(this$static, numPosStates) {
   for (; this$static.m_NumPosStates < numPosStates; ++this$static.m_NumPosStates) {
      this$static.m_LowCoder[this$static.m_NumPosStates] = $BitTreeDecoder({}, 3);
      this$static.m_MidCoder[this$static.m_NumPosStates] = $BitTreeDecoder({}, 3);
   }
}

function $Decode(this$static, rangeDecoder, posState) {
   if (!$DecodeBit(rangeDecoder, this$static.m_Choice, 0))
      return $Decode_0(this$static.m_LowCoder[posState], rangeDecoder);

   let symbol = 8;
   if (!$DecodeBit(rangeDecoder, this$static.m_Choice, 1))
      symbol += $Decode_0(this$static.m_MidCoder[posState], rangeDecoder);
   else
      symbol += 8 + $Decode_0(this$static.m_HighCoder, rangeDecoder);

   return symbol;
}

function $Decoder$LenDecoder(this$static) {
   this$static.m_Choice = initDim(2);
   this$static.m_LowCoder = initDim(16);
   this$static.m_MidCoder = initDim(16);
   this$static.m_HighCoder = $BitTreeDecoder({}, 8);
   this$static.m_NumPosStates = 0;
   return this$static;
}

function $Init(this$static) {
   InitBitModels(this$static.m_Choice);
   for (let posState = 0; posState < this$static.m_NumPosStates; ++posState) {
      InitBitModels(this$static.m_LowCoder[posState].Models);
      InitBitModels(this$static.m_MidCoder[posState].Models);
   }
   InitBitModels(this$static.m_HighCoder.Models);
}


function $Create_0(this$static, numPosBits, numPrevBits) {
   if (this$static.m_Coders != null && this$static.m_NumPrevBits === numPrevBits && this$static.m_NumPosBits === numPosBits)
      return;
   this$static.m_NumPosBits = numPosBits;
   this$static.m_PosMask = (1 << numPosBits) - 1;
   this$static.m_NumPrevBits = numPrevBits;
   const numStates = 1 << this$static.m_NumPrevBits + this$static.m_NumPosBits;
   this$static.m_Coders = initDim(numStates);
   for (let i = 0; i < numStates; ++i)
      this$static.m_Coders[i] = $Decoder$LiteralDecoder$Decoder2({});
}

function $GetDecoder(this$static, pos, prevByte) {
   return this$static.m_Coders[((pos & this$static.m_PosMask) << this$static.m_NumPrevBits) + ((prevByte & 255) >>> 8 - this$static.m_NumPrevBits)];
}

function $Init_0(this$static) {
   const numStates = 1 << this$static.m_NumPrevBits + this$static.m_NumPosBits;
   for (let i = 0; i < numStates; ++i)
      InitBitModels(this$static.m_Coders[i].m_Decoders);
}

function $DecodeNormal(this$static, rangeDecoder) {
   let symbol = 1;
   do
      symbol = symbol << 1 | $DecodeBit(rangeDecoder, this$static.m_Decoders, symbol);
   while (symbol < 256);
   return symbol << 24 >> 24;
}

function $DecodeWithMatchByte(this$static, rangeDecoder, matchByte) {
   let bit, matchBit, symbol = 1;
   do {
      matchBit = matchByte >> 7 & 1;
      matchByte <<= 1;
      bit = $DecodeBit(rangeDecoder, this$static.m_Decoders, (1 + matchBit << 8) + symbol);
      symbol = symbol << 1 | bit;
      if (matchBit !== bit) {
         while (symbol < 256)
            symbol = symbol << 1 | $DecodeBit(rangeDecoder, this$static.m_Decoders, symbol);

         break;
      }
   } while (symbol < 256);
   return symbol << 24 >> 24;
}

function $Decoder$LiteralDecoder$Decoder2(this$static) {
   this$static.m_Decoders = initDim(768);
   return this$static;
}

function $BitTreeDecoder(this$static, numBitLevels) {
   this$static.NumBitLevels = numBitLevels;
   this$static.Models = initDim(1 << numBitLevels);
   return this$static;
}

function $Decode_0(this$static, rangeDecoder) {
   let m = 1;
   for (let bitIndex = this$static.NumBitLevels; bitIndex; --bitIndex)
      m = (m << 1) + $DecodeBit(rangeDecoder, this$static.Models, m);

   return m - (1 << this$static.NumBitLevels);
}

function $ReverseDecode(this$static, rangeDecoder) {
   let bit, bitIndex, m = 1, symbol = 0;
   for (bitIndex = 0; bitIndex < this$static.NumBitLevels; ++bitIndex) {
      bit = $DecodeBit(rangeDecoder, this$static.Models, m);
      m <<= 1;
      m += bit;
      symbol |= bit << bitIndex;
   }
   return symbol;
}

function ReverseDecode(Models, startIndex, rangeDecoder, NumBitLevels) {
   let bit, bitIndex, m = 1, symbol = 0;
   for (bitIndex = 0; bitIndex < NumBitLevels; ++bitIndex) {
      bit = $DecodeBit(rangeDecoder, Models, startIndex + m);
      m <<= 1;
      m += bit;
      symbol |= bit << bitIndex;
   }
   return symbol;
}

function $DecodeBit(this$static, probs, index) {
   const prob = probs[index],
         newBound = (this$static.Range >>> 11) * prob;
   if ((this$static.Code ^ -2147483648) < (newBound ^ -2147483648)) {
      this$static.Range = newBound;
      probs[index] = prob + (2048 - prob >>> 5) << 16 >> 16;
      if (!(this$static.Range & -16777216)) {
         this$static.Code = this$static.Code << 8 | $read(this$static.Stream);
         this$static.Range <<= 8;
      }
      return 0;
   } else {
      this$static.Range -= newBound;
      this$static.Code -= newBound;
      probs[index] = prob - (prob >>> 5) << 16 >> 16;
      if (!(this$static.Range & -16777216)) {
         this$static.Code = this$static.Code << 8 | $read(this$static.Stream);
         this$static.Range <<= 8;
      }
      return 1;
   }
}

function $DecodeDirectBits(this$static, numTotalBits) {
   let i, t, result = 0;
   for (i = numTotalBits; i; --i) {
      this$static.Range >>>= 1;
      t = this$static.Code - this$static.Range >>> 31;
      this$static.Code -= this$static.Range & t - 1;
      result = result << 1 | 1 - t;
      if (!(this$static.Range & -16777216)) {
         this$static.Code = this$static.Code << 8 | $read(this$static.Stream);
         this$static.Range <<= 8;
      }
   }
   return result;
}

function $Init_8(this$static) {
   this$static.Code = 0;
   this$static.Range = -1;
   for (let i = 0; i < 5; ++i)
      this$static.Code = this$static.Code << 8 | $read(this$static.Stream);
}

function InitBitModels(probs) {
   for (let i = probs.length - 1; i >= 0; --i)
      probs[i] = 1024;
}

/** @summary Decode a multibyte integer as used in xz headers.
  * @return {Array} [value, position after the encoded integer] */
function readVarint(buf, pos) {
   let value = buf[pos] & 0x7f,
       shift = 0;
   while (buf[pos++] & 0x80) {
      if (++shift > 8)
         throw Error('LZMA: malformed xz varint');
      value += (buf[pos] & 0x7f) * Math.pow(2, 7 * shift);
   }
   return [value, pos];
}

/** @summary Decode the LZMA2 filter property byte into a dictionary size.
  * @desc xz-file-format.txt 5.3.1: bit 0 selects between 2^n and 3*2^(n-1). */
function lzma2DictSize(prop) {
   if (prop > 40)
      throw Error(`LZMA: invalid LZMA2 dictionary size property ${prop}`);
   if (prop === 40)
      return 0xffffffff;
   return (2 | (prop & 1)) * Math.pow(2, (prop >> 1) + 11);
}

/** Size in bytes of the Check field, indexed by the stream flags check id. */
const XZ_CHECK_SIZES = [0, 4, 4, 4, 8, 8, 8, 16, 16, 16, 32, 32, 32, 64, 64, 64];

/** @summary Validate the xz stream header.
  * @return {number} size of each block's trailing Check field */
function parseXzStreamHeader(buf) {
   if (buf.length < 24 || buf[0] !== 0xfd || buf[1] !== 0x37 || buf[2] !== 0x7a ||
       buf[3] !== 0x58 || buf[4] !== 0x5a || buf[5] !== 0x00)
      throw Error('LZMA: not an xz stream');

   return XZ_CHECK_SIZES[buf[7] & 0x0f];
}

/** @summary Parse one xz block header.
  * @desc ROOT emits a single block per compressed portion via
  * lzma_easy_buffer_encode, but the xz CLI splits large inputs into several, so
  * the caller loops over them.
  * @param buf the whole xz stream
  * @param start offset of the block header
  * @return {Object} { offset, dictSize } — offset of the block's first LZMA2 chunk */
function parseXzBlockHeader(buf, start) {
   // The header's real size is encoded as size/4 - 1; a 0 marks the index instead.
   const blockHeaderSize = (buf[start] + 1) * 4;
   if (buf[start] === 0)
      throw Error('LZMA: expected an xz block, found the index');

   const flags = buf[start + 1],
         numFilters = (flags & 0x03) + 1;
   if (flags & 0x3c)
      throw Error('LZMA: reserved bits set in xz block flags');

   let pos = start + 2;
   if (flags & 0x40) pos = readVarint(buf, pos)[1]; // compressed size, unused
   if (flags & 0x80) pos = readVarint(buf, pos)[1]; // uncompressed size, unused

   let dictSize = -1;
   for (let i = 0; i < numFilters; ++i) {
      let id, propsSize;
      [id, pos] = readVarint(buf, pos);
      [propsSize, pos] = readVarint(buf, pos);
      // 0x21 is LZMA2; anything else (delta, BCJ) would need a second filter stage,
      // which ROOT never writes. Fail loudly rather than decode garbage.
      if (id !== 0x21 || propsSize !== 1)
         throw Error(`LZMA: unsupported xz filter 0x${id.toString(16)}`);
      dictSize = lzma2DictSize(buf[pos]);
      pos += propsSize;
   }

   return { offset: start + blockHeaderSize, dictSize };
}

/** @summary Apply an LZMA2 dictionary reset. */
function resetDict(d) {
   $Flush_0(d.m_OutWindow);
   d.m_OutWindow._pos = 0;
   d.m_OutWindow._streamPos = 0;
   // In LZMA2 the uncompressed position that drives posState and the literal
   // context is measured from the last dictionary reset, not from the chunk start.
   d.nowPos64 = P0_longLit;
   d.prevByte = 0;
}

/** @summary Decode one xz block's LZMA2 chunk sequence.
  * @desc Each chunk carries reset flags saying how much decoder state it inherits
  * from the previous one. A chunk with reset mode 0 inherits everything, which is
  * why the decoder, its probability models and the dictionary window all live
  * across the loop rather than being rebuilt per chunk — the original code
  * decoded a single chunk and so failed on any buffer over ~2 MiB.
  * @return {number} offset just past the chunk sequence terminator */
function decodeLzma2Chunks(buf, start, d) {
   let pos = start,
       needProps = true;

   while (true) {
      const control = buf[pos++];

      if (control === undefined)
         throw Error('LZMA: truncated LZMA2 stream');

      if (control === 0)
         return pos; // end of this block's chunk sequence

      if (control <= 2) {
         // Uncompressed chunk. The bytes still have to enter the dictionary,
         // so they go through $PutByte rather than straight to the output.
         const size = ((buf[pos] << 8) | buf[pos + 1]) + 1;
         pos += 2;
         if (control === 1)
            resetDict(d);
         for (let i = 0; i < size; ++i)
            $PutByte(d.m_OutWindow, buf[pos + i]);
         $Flush_0(d.m_OutWindow);
         d.prevByte = buf[pos + size - 1];
         d.nowPos64 = add(d.nowPos64, fromInt(size));
         d.state = 0;
         d.rep0 = d.rep1 = d.rep2 = d.rep3 = 0;
         needProps = true;
         pos += size;
         continue;
      }

      if (control < 0x80)
         throw Error(`LZMA: invalid LZMA2 control byte ${control}`);

      const usize = ((control & 0x1f) << 16) + (buf[pos] << 8) + buf[pos + 1] + 1,
            csize = (buf[pos + 2] << 8) + buf[pos + 3] + 1,
            reset = (control >> 5) & 0x03;
      pos += 4;

      if (reset >= 2) {
         if (!$SetLcLpPbFromByte(d, buf[pos++]))
            throw Error('LZMA: invalid LZMA2 properties byte');
         needProps = false;
      } else if (needProps)
         throw Error('LZMA: first LZMA2 chunk carries no properties');

      if (reset >= 1) {
         $InitProbs(d);
         d.state = 0;
         d.rep0 = d.rep1 = d.rep2 = d.rep3 = 0;
      }

      if (reset === 3)
         resetDict(d);

      // The range coder is self-contained per chunk and always re-initialised.
      d.m_RangeDecoder.Stream = $ByteArrayInputStream({}, buf.subarray(pos, pos + csize));
      $Init_8(d.m_RangeDecoder);

      d.outSize = add(d.nowPos64, fromInt(usize));
      while (compare(d.nowPos64, d.outSize) < 0) {
         const res = $CodeOneChunk(d);
         if (res === -1)
            throw Error('LZMA: corrupted input');
         if (res === 1)
            break; // end marker; LZMA2 does not use them, so treat as end of chunk
      }

      $Flush_0(d.m_OutWindow);
      // Advance by the declared size — the range decoder reads ahead.
      pos += csize;
   }
}

/** @summary decompress a ROOT LZMA buffer
  * @desc The buffer is a complete xz stream. ROOT writes a single block per
  * compressed portion via lzma_easy_buffer_encode, but the xz CLI splits large
  * inputs into several, so blocks are looped over here too. */
function decompress(uint8arr, tgt8arr, expected_size) {
   const checkSize = parseXzStreamHeader(uint8arr),
         out = $ByteArrayOutputStream({}, tgt8arr),
         d = $Decoder({});

   d.m_OutWindow._stream = out;

   let blockStart = 12; // just past the stream header

   while (out.count < expected_size) {
      // A 0 where a block header size would be is the index indicator: no more blocks.
      if (uint8arr[blockStart] === 0)
         break;

      const { offset, dictSize } = parseXzBlockHeader(uint8arr, blockStart);

      // No match can reach further back than the total output, so clamping keeps
      // the window small without affecting correctness. $SetDictionarySize
      // reallocates only when the size changes, so further blocks are free.
      $SetDictionarySize(d, Math.max(4096, Math.min(dictSize, expected_size)));

      d.state = 0;
      d.rep0 = d.rep1 = d.rep2 = d.rep3 = 0;
      d.nowPos64 = P0_longLit;
      d.prevByte = 0;

      let pos = decodeLzma2Chunks(uint8arr, offset, d);

      $Flush_0(d.m_OutWindow);

      // Block padding aligns the block to a 4-byte boundary, then comes the Check.
      pos += (4 - ((pos - blockStart) % 4)) % 4;
      blockStart = pos + checkSize;
   }

   if (out.count !== expected_size)
      throw Error(`LZMA: mismatch unpacked buffer size ${out.count} != ${expected_size}`);

   return out.count;
}

export { decompress };
