<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\Bundle\FieldTypeRichText\Controller;

use Ibexa\Contracts\FieldTypeRichText\Configuration\ProviderService;
use Ibexa\FieldTypeRichText\REST\Value\RichTextConfig;
use Ibexa\Rest\Server\Controller;

final class RichTextConfigController extends Controller
{
    private ProviderService $providerService;

    public function __construct(ProviderService $providerService)
    {
        $this->providerService = $providerService;
    }

    public function loadConfigAction(): RichTextConfig
    {
        return new RichTextConfig($this->providerService->getConfiguration());
    }
}
