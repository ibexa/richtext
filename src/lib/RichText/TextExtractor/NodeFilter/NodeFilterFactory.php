<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\FieldTypeRichText\RichText\TextExtractor\NodeFilter;

use Ibexa\Contracts\FieldTypeRichText\RichText\TextExtractor\NodeFilterFactoryInterface;
use Ibexa\Contracts\FieldTypeRichText\RichText\TextExtractor\NodeFilterInterface;

final class NodeFilterFactory implements NodeFilterFactoryInterface
{
    public function createPathFilter(string ...$path): NodeFilterInterface
    {
        return new NodePathFilter(...$path);
    }
}
