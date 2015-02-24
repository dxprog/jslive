<?php

class RealLiveParser {

    // The human readable version
    private $_tokens = [
        'operator' => [ '=', '+', '*', '-', '/', '|', '&', '!', '<', '>' ],
        'string' => [ '\'', '"' ],
        'whitespace' => [ '\t', ' ' ],
        'newline' => [ '\n', '\r' ],
        'number' => [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ],
        'function' => [ '(' ],
        'endfunc' => [ ')' ],
        'separator' => [ ',' ],
        'label' => [ '@' ],
        'array' => [ '{' ],
        'endarray' => [ '}' ],
        'comment' => [ '#' ]
    ];

    // The computer readable version
    private $_tokenHashMap = [];

    private $_lookup = [];
    private $_errors = [];

    public function __construct($file) {
        $this->_generateLookupHashMap();

        $data = file($file);
        if (is_array($data) && count($data)) {
            $this->_parseFile($data);
        }
    }

    private function _parseFile(array $data) {
        $ast = [];
        $lookup = [];

        foreach ($data as $line) {
            $instruction = $this->_parseChunk($line, count($ast), true);
            if ($instruction) {
                $ast[] = $instruction;
            }
        }

        print_r($ast);
    }

    private function _parseChunk($code, $lineNumber, $first = false) {
        $retVal = null;

        $code = trim($code);
        if (strlen($code)) {
            // RealLive code is newline delimited, so we can take a peek at the first character and get a pretty good idea of what's going on
            $type = $this->_matchTokenType($code{0});

            $typeMethod = '_parse' . $type;
            if (method_exists($this, $typeMethod)) {
                $retVal = call_user_func_array([ $this, $typeMethod ], [ $code, $lineNumber, $first ]);
            } else {
                echo 'No parser implemented for token: ', $type, PHP_EOL;
            }

        }

        return $retVal;
    }

    /**
     * Returns the type of token the character is
     */
    private function _matchTokenType($character) {
        return isset($this->_tokenHashMap[$character]) ? $this->_tokenHashMap[$character] : 'character';
    }

    /**
     * Generates a hashmap of the tokens for fast type lookup
     */
    private function _generateLookupHashMap() {
        foreach($this->_tokens as $type => $tokens) {
            foreach ($tokens as $token) {
                $this->_tokenHashMap[$token] = $type;
            }
        }
    }

    /**
     * Parses standard characters
     */
    private function _parseCharacter($code, $lineNumber, $first = false) {
        $retVal = [];

        $token = '';
        $len = $this->_iterateCode($code, function($character, $type, $index) use ($code, $lineNumber, &$token, &$retVal) {

            if ($type === 'number' || $type === 'character') {
                $token .= $character;

            // Ignore whitespace
            } else if ($type === 'whitespace') {
                // NOOP

            // Otherwise, save the current token and use the next token as the operation type for this line.
            // Then, parse the remaining code as it's own chunk
            } else {
                $retVal['token'] = $token;
                $retVal['action'] = $type;

                $ast = $this->_parseChunk(substr($code, $index), $lineNumber);
                if ($ast) {
                    $retVal['ast'] = $ast;
                }

                return true;
            }
        });

        if (!count($retVal)) {
            $retVal = null;
        }

        return $retVal;
    }

    private function _parseFunction($code, $lineNumber, $first = false) {
        $retVal = [];



    }

    /**
     * Parses a label and adds it to the lookup table
     */
    private function _parseLabel($code, $lineNumber, $first = false) {

        $retVal = null;

        $labelName = '';

        // Start at 1 to skip the @ symbol
        $code = substr($code, 1);
        $len = $this->_iterateCode($code, function($character, $type, $index) use (&$labelName) {
            if ($type === 'character' || $type === 'number') {
                $labelName .= $character;
            } else {
                return true;
            }
        });

        // If this is a label marker, we're not going to add to the AST, but will add to the lookup table
        if ($first) {
            // Ensure that there were no extraneous characters
            if (strlen($code) !== $len) {
                $this->_logError($lineNumber, 'Invalid character in label name');

            // Ensure that were was a label at all
            } else if (!strlen($labelName)) {
                $this->_logError($lineNumber, 'Expected label name');

            // Ensure that this label hasn't already been defined
            } else if (isset($this->_lookup[$labelName])) {
                $this->_logError($lineNumber, 'Duplicate label definition');

            } else {
                $this->_lookup[$labelName] = $lineNumber;
            }

        // Anywhere else on a line, just return the name of the label
        } else {
            $retVal = $labelName;
        }

        return $retVal;

    }

    /**
     * Noops for comments
     */
    private function _parseComment($code, $lineNumber, $first = false) {
        return null;
    }

    private function _logError($lineNumber, $message) {
        $this->_errors[] = $lineNumber . ': ' . $message;
    }

    /**
     * Loops and parses a chunk of code and provides that to a callback. Returns the position of the last character parsed
     */
    private function _iterateCode($code, $callback) {
        for ($i = 0, $len = strlen($code); $i < $len; $i++) {
            $character = $code{$i};
            $type = $this->_matchTokenType($character);

            // If the callback returns a non-false value, break out of the loop
            if ($callback($character, $type, $i)) {
                break;
            }
        }

        return $i;
    }

}